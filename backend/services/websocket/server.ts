import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const io = new Server({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'https://app.farlabs.ai',
    credentials: true
  }
});

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.info('[websocket] Redis adapter initialised');
  })
  .catch((error) => {
    console.error('[websocket] Redis connection failed', error);
  });

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('Missing token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'insecure-secret') as {
      userId: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new Error('Authentication failed');

    socket.data.userId = user.id;
    socket.data.walletAddress = user.walletAddress;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.info(`[websocket] user connected ${socket.data.userId}`);

  socket.join(`user:${socket.data.userId}`);

  socket.on('subscribe:inference', async (taskId: string) => {
    socket.join(`task:${taskId}`);
    const task = await getTaskStatus(taskId);
    socket.emit('task:status', task);
  });

  socket.on('subscribe:node', async (nodeId: string) => {
    const node = await prisma.gPUNode.findFirst({
      where: { id: nodeId, ownerAddress: socket.data.walletAddress }
    });
    if (node) {
      socket.join(`node:${nodeId}`);
      socket.emit('node:status', await getNodeMetrics(nodeId));
    }
  });

  socket.on('subscribe:revenue', async () => {
    socket.join(`revenue:${socket.data.walletAddress}`);
    socket.emit('revenue:update', await calculateUserRevenue(socket.data.walletAddress));
  });

  socket.on('disconnect', () => {
    console.info(`[websocket] user disconnected ${socket.data.userId}`);
  });
});

subClient.subscribe('inference:updates', (message) => {
  try {
    const data = JSON.parse(message);
    io.to(`task:${data.taskId}`).emit('inference:token', data);
  } catch (error) {
    console.error('[websocket] failed to decode inference update', error);
  }
});

subClient.subscribe('node:metrics', (message) => {
  try {
    const data = JSON.parse(message);
    io.to(`node:${data.nodeId}`).emit('node:metrics', data);
  } catch (error) {
    console.error('[websocket] failed to decode node metrics', error);
  }
});

subClient.subscribe('revenue:updates', (message) => {
  try {
    const data = JSON.parse(message);
    io.to(`revenue:${data.walletAddress}`).emit('revenue:update', data);
  } catch (error) {
    console.error('[websocket] failed to decode revenue update', error);
  }
});

io.listen(3001);

async function getTaskStatus(taskId: string) {
  return prisma.inferenceTask.findUnique({
    where: { taskId },
    select: {
      status: true,
      tokensGenerated: true,
      costFar: true,
      node: { select: { nodeId: true } }
    }
  });
}

async function getNodeMetrics(nodeId: string) {
  return prisma.gPUNode.findUnique({
    where: { id: nodeId },
    select: {
      status: true,
      tasksCompleted: true,
      totalEarned: true,
      uptimePercentage: true,
      reliabilityScore: true
    }
  });
}

async function calculateUserRevenue(walletAddress: string) {
  const revenue = await prisma.revenueStream.groupBy({
    by: ['streamType'],
    where: { user: { walletAddress } },
    _sum: { amountFar: true, amountUsd: true }
  });

  return revenue.map((entry) => ({
    stream: entry.streamType,
    far: entry._sum.amountFar ?? 0,
    usd: entry._sum.amountUsd ?? 0
  }));
}
