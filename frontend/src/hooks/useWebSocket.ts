import { useEffect, useRef } from 'react';

interface UseWebSocketOptions<TMessage> {
  url?: string;
  topics?: string[];
  onMessage?: (message: TMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket<TMessage = Record<string, unknown>>({
  url = process.env.NEXT_PUBLIC_WS_URL ?? 'wss://ws.farlabs.ai',
  topics = [],
  onMessage,
  onOpen,
  onClose
}: UseWebSocketOptions<TMessage>) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      topics.forEach((topic) => {
        socket.send(JSON.stringify({ type: 'subscribe', topic }));
      });
      onOpen?.();
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as TMessage;
        onMessage?.(data);
      } catch (error) {
        console.warn('Failed to parse websocket message', error);
      }
    });

    socket.addEventListener('close', () => {
      onClose?.();
    });

    return () => {
      socket.close();
    };
  }, [url, topics.join(':'), onMessage, onOpen, onClose]);
}
