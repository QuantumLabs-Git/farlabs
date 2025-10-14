Far Labs Technical Specification
Complete AWS Deployment Guide

Table of Contents

Executive Summary
System Architecture
AWS Infrastructure
Frontend Specification
Backend Services
Smart Contracts
Database Schema
Security Architecture
Deployment Pipeline
Monitoring & Analytics
Cost Estimates


1. Executive Summary
Far Labs is a comprehensive Web3 platform providing multiple revenue streams for $FAR token holders through six integrated services:

Far Inference: Decentralized AI inference network
Farcana Game: Blockchain gaming ecosystem
Far DeSci: Decentralized science platform
Far GameD: Game distribution platform
FarTwin AI: Digital twin AI platform
Far GPU De-Pin: GPU resource sharing network
$FAR Staking: Token staking mechanism

Key Technologies

Frontend: Next.js 14+, TypeScript, Tailwind CSS, Web3 integration
Backend: Python (FastAPI), Node.js microservices
Blockchain: BSC Smart Contracts, Web3.py
Infrastructure: AWS ECS, RDS, ElastiCache, CloudFront
Databases: PostgreSQL, MongoDB, DynamoDB


2. System Architecture
2.1 High-Level Architecture
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                           │
├─────────────────────────────────────────────────────────────────┤
│                    Application Load Balancer                     │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│   Frontend  │   API       │   WebSocket │   Admin              │
│   (Next.js) │   Gateway   │   Server    │   Dashboard          │
├─────────────┴─────────────┴─────────────┴──────────────────────┤
│                         ECS Fargate                              │
├──────────────────────────────────────────────────────────────────┤
│  Microservices Layer                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐│
│  │ Inference  │ │   Gaming   │ │   DeSci    │ │   GPU Pool   ││
│  │  Service   │ │  Service   │ │  Service   │ │   Manager    ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘│
├──────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐│
│  │PostgreSQL  │ │  MongoDB   │ │  DynamoDB  │ │ ElastiCache  ││
│  │   (RDS)    │ │  (Atlas)   │ │            │ │   (Redis)    ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘│
├──────────────────────────────────────────────────────────────────┤
│                    Blockchain Layer (BSC)                        │
│  Smart Contracts: Token, Staking, Payment, Registry              │
└──────────────────────────────────────────────────────────────────┘
2.2 Component Communication Flow
yamlUserRequest:
  1. CloudFront → Next.js Frontend
  2. Frontend → API Gateway (REST/GraphQL)
  3. API Gateway → Appropriate Microservice
  4. Microservice → Database/Blockchain
  5. Response → Frontend → User

WebSocketFlow:
  1. Client → ALB → WebSocket Server
  2. WebSocket → Redis Pub/Sub
  3. Redis → All connected clients

PaymentFlow:
  1. User initiates payment → Web3 wallet
  2. Smart contract execution → BSC
  3. Event listener → Backend service
  4. Database update → Service activation

3. AWS Infrastructure
3.1 Infrastructure as Code (Terraform)
hcl# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "farlabs-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "farlabs-vpc"
  }
}

# Public Subnets for ALB
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "farlabs-public-${count.index}"
  }
}

# Private Subnets for ECS Tasks
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${10 + count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "farlabs-private-${count.index}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "farlabs-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier     = "farlabs-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r5.xlarge"
  
  allocated_storage     = 100
  storage_encrypted     = true
  storage_type          = "gp3"
  iops                  = 3000
  
  db_name  = "farlabs"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = true
  deletion_protection    = true
  
  tags = {
    Name = "farlabs-database"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "farlabs-redis"
  engine              = "redis"
  node_type           = "cache.r6g.xlarge"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
}

# S3 Buckets
resource "aws_s3_bucket" "static_assets" {
  bucket = "farlabs-static-assets"
}

resource "aws_s3_bucket" "model_storage" {
  bucket = "farlabs-model-storage"
}

resource "aws_s3_bucket" "user_uploads" {
  bucket = "farlabs-user-uploads"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.id}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.main.id}"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
3.2 ECS Task Definitions
json{
  "family": "farlabs-frontend",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "nextjs-app",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/farlabs-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.farlabs.ai"},
        {"name": "NEXT_PUBLIC_WS_URL", "value": "wss://ws.farlabs.ai"},
        {"name": "NEXT_PUBLIC_BSC_RPC", "value": "https://bsc-dataseed.binance.org/"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:farlabs/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/farlabs-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
3.3 Auto-Scaling Configuration
yaml# ecs-autoscaling.yaml
Frontend:
  TargetCapacity: 4
  MinCapacity: 2
  MaxCapacity: 20
  ScaleUpCooldown: 60
  ScaleDownCooldown: 300
  Metrics:
    - Type: TargetTrackingScaling
      TargetValue: 70
      PredefinedMetricType: ECSServiceAverageCPUUtilization
    - Type: TargetTrackingScaling  
      TargetValue: 80
      PredefinedMetricType: ECSServiceAverageMemoryUtilization

APIServices:
  TargetCapacity: 6
  MinCapacity: 3
  MaxCapacity: 30
  Metrics:
    - RequestCountPerTarget: 1000
    - ResponseTime: 500ms

GPUNodes:
  ScalingPolicy: StepScaling
  Steps:
    - NetworkUtilization < 30%: Scale down by 2
    - NetworkUtilization 30-70%: Maintain
    - NetworkUtilization > 70%: Scale up by 4
    - NetworkUtilization > 90%: Scale up by 8

4. Frontend Specification
4.1 Project Structure
farlabs-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── inference/
│   │   │   ├── page.tsx
│   │   │   ├── playground/
│   │   │   └── components/
│   │   ├── gaming/
│   │   ├── desci/
│   │   ├── gamed/
│   │   ├── fartwin/
│   │   ├── gpu/
│   │   ├── staking/
│   │   └── revenue/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── web3/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── TokenBalance.tsx
│   │   │   └── TransactionHistory.tsx
│   │   └── charts/
│   │       ├── RevenueChart.tsx
│   │       └── StakingCalculator.tsx
│   ├── lib/
│   │   ├── web3/
│   │   │   ├── contracts.ts
│   │   │   └── providers.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── endpoints.ts
│   │   └── utils/
│   ├── hooks/
│   │   ├── useWeb3.ts
│   │   ├── useWebSocket.ts
│   │   └── useRevenue.ts
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── package.json
└── tsconfig.json
4.2 Homepage Implementation
tsx// src/app/page.tsx
import { ServiceGrid } from '@/components/home/ServiceGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';

const services = [
  {
    id: 'inference',
    icon: '🧠',
    title: 'Far Inference',
    description: 'Decentralized AI inference network for LLMs and machine learning models',
    href: '/inference',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 'gaming',
    icon: '🎮',
    title: 'Farcana Game',
    description: 'Next-gen blockchain gaming ecosystem with play-to-earn mechanics',
    href: '/gaming',
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'desci',
    icon: '🧪',
    title: 'Far DeSci',
    description: 'Decentralized science platform for research collaboration and funding',
    href: '/desci',
    gradient: 'from-green-600 to-teal-600'
  },
  {
    id: 'gamed',
    icon: '🏆',
    title: 'Far GameD',
    description: 'Game distribution platform with blockchain-based licensing',
    href: '/gamed',
    gradient: 'from-orange-600 to-red-600'
  },
  {
    id: 'fartwin',
    icon: '👥',
    title: 'FarTwin AI',
    description: 'Digital twin AI platform for personalized virtual assistants',
    href: '/fartwin',
    gradient: 'from-indigo-600 to-purple-600'
  },
  {
    id: 'gpu',
    icon: '🖥️',
    title: 'Far GPU De-Pin',
    description: 'A depin network where users can supply their GPU for training AI models',
    href: '/gpu',
    gradient: 'from-yellow-600 to-orange-600'
  },
  {
    id: 'staking',
    icon: '💎',
    title: '$FAR Staking',
    description: 'The utility token powering the entire Far Labs ecosystem',
    href: '/staking',
    gradient: 'from-purple-600 to-indigo-600'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F]">
      <HeroSection />
      <StatsSection />
      <ServiceGrid services={services} />
    </main>
  );
}
4.3 Service Card Component
tsx// src/components/home/ServiceCard.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface ServiceCardProps {
  service: {
    id: string;
    icon: string;
    title: string;
    description: string;
    href: string;
    gradient: string;
  };
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={service.href}>
        <div className="relative bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-8 
                      overflow-hidden transition-all duration-300 hover:border-[#7C3AED]
                      hover:shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          
          {/* Gradient background on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-500">
            <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} 
                          opacity-10`} />
          </div>
          
          {/* Mouse follow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300"
               style={{
                 background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), 
                            rgba(124, 58, 237, 0.1), transparent 40%)`
               }} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-5xl mb-4 grayscale contrast-200 opacity-80 
                          group-hover:opacity-100 transition-opacity">
              {service.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 
                         bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] 
                         bg-clip-text text-transparent">
              {service.title}
            </h3>
            
            <p className="text-[#A3A3A3] leading-relaxed">
              {service.description}
            </p>
            
            <div className="mt-6 flex items-center text-[#7C3AED] font-semibold">
              <span className="group-hover:translate-x-2 transition-transform">
                Explore →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
4.4 Revenue Calculator Implementation
tsx// src/components/revenue/RevenueCalculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { Line } from 'recharts';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('recharts').then(mod => mod.LineChart), { 
  ssr: false 
});

interface RevenueStream {
  id: string;
  name: string;
  enabled: boolean;
  monthlyBase: number;
  growthRate: number;
}

export function RevenueCalculator() {
  const [stakingAmount, setStakingAmount] = useState(10000);
  const [stakingPeriod, setStakingPeriod] = useState(12);
  const [streams, setStreams] = useState<RevenueStream[]>([
    { 
      id: 'inference', 
      name: 'Far Inference', 
      enabled: true, 
      monthlyBase: 0.08, // 8% monthly return estimate
      growthRate: 1.05 // 5% monthly growth
    },
    {
      id: 'gpu',
      name: 'Far GPU De-Pin',
      enabled: true,
      monthlyBase: 0.06, // Based on GaPIN model
      growthRate: 1.15 // 15% monthly growth in Year 1
    },
    {
      id: 'gaming',
      name: 'Farcana Game',
      enabled: false,
      monthlyBase: 0.04,
      growthRate: 1.03
    },
    {
      id: 'desci',
      name: 'Far DeSci',
      enabled: false,
      monthlyBase: 0.02,
      growthRate: 1.02
    },
    {
      id: 'gamed',
      name: 'Far GameD',
      enabled: false,
      monthlyBase: 0.03,
      growthRate: 1.04
    },
    {
      id: 'fartwin',
      name: 'FarTwin AI',
      enabled: false,
      monthlyBase: 0.05,
      growthRate: 1.08
    }
  ]);
  
  const projectedRevenue = useMemo(() => {
    const data = [];
    let cumulative = 0;
    
    for (let month = 0; month <= 36; month++) {
      let monthlyRevenue = 0;
      
      streams.forEach(stream => {
        if (stream.enabled) {
          const baseRevenue = stakingAmount * stream.monthlyBase;
          const growthMultiplier = Math.pow(stream.growthRate, month);
          monthlyRevenue += baseRevenue * growthMultiplier;
        }
      });
      
      cumulative += monthlyRevenue;
      
      data.push({
        month,
        monthly: monthlyRevenue,
        cumulative: cumulative,
        roi: (cumulative / stakingAmount) * 100
      });
    }
    
    return data;
  }, [stakingAmount, streams]);
  
  const toggleStream = (id: string) => {
    setStreams(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };
  
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2D2D2D]">
      <h2 className="text-3xl font-bold text-white mb-8 
                   bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] 
                   bg-clip-text text-transparent">
        Revenue Forecast Calculator
      </h2>
      
      {/* Revenue Stream Selection */}
      <div className="mb-8">
        <h3 className="text-xl text-white mb-4">Select Revenue Streams</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {streams.map(stream => (
            <label key={stream.id} 
                   className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={stream.enabled}
                onChange={() => toggleStream(stream.id)}
                className="w-5 h-5 rounded border-[#2D2D2D] bg-[#262626] 
                         checked:bg-gradient-to-r checked:from-[#7C3AED] 
                         checked:to-[#A78BFA]"
              />
              <span className={stream.enabled ? 'text-white' : 'text-[#737373]'}>
                {stream.name}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Staking Controls */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-[#A3A3A3] mb-2">
            Staking Amount ($FAR)
          </label>
          <input
            type="number"
            value={stakingAmount}
            onChange={(e) => setStakingAmount(Number(e.target.value))}
            className="w-full bg-[#262626] border border-[#2D2D2D] rounded-lg 
                     px-4 py-3 text-white focus:border-[#7C3AED] 
                     focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-[#A3A3A3] mb-2">
            Staking Period: {stakingPeriod} months
          </label>
          <input
            type="range"
            min="1"
            max="36"
            value={stakingPeriod}
            onChange={(e) => setStakingPeriod(Number(e.target.value))}
            className="w-full accent-[#7C3AED]"
          />
        </div>
      </div>
      
      {/* Results Display */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#262626] rounded-xl p-6">
          <p className="text-[#A3A3A3] mb-2">Total Investment</p>
          <p className="text-3xl font-bold text-white">
            ${stakingAmount.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-[#262626] rounded-xl p-6">
          <p className="text-[#A3A3A3] mb-2">Projected Return ({stakingPeriod}mo)</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] 
                      to-[#A78BFA] bg-clip-text text-transparent">
            ${projectedRevenue[stakingPeriod]?.cumulative.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-[#262626] rounded-xl p-6">
          <p className="text-[#A3A3A3] mb-2">ROI</p>
          <p className="text-3xl font-bold text-[#10B981]">
            {projectedRevenue[stakingPeriod]?.roi.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-[#262626] rounded-xl p-6">
        <h3 className="text-xl text-white mb-4">Revenue Projection</h3>
        <div className="h-96">
          {/* Chart component would go here */}
          {/* Using recharts or similar library */}
        </div>
      </div>
    </div>
  );
}

5. Backend Services
5.1 Far Inference Service (Python/FastAPI)
python# services/inference/main.py
from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from web3 import Web3
import asyncio
import redis.asyncio as redis
from typing import Optional, List
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import uvicorn

app = FastAPI(title="Far Labs Inference Service")
security = HTTPBearer()

# Configuration
BSC_RPC = "https://bsc-dataseed.binance.org/"
REDIS_URL = "redis://elasticache-endpoint.amazonaws.com:6379"
CONTRACT_ADDRESS = "0x..." # Payment contract address

# Initialize connections
w3 = Web3(Web3.HTTPProvider(BSC_RPC))
redis_client = redis.from_url(REDIS_URL)

# Model registry
MODEL_REGISTRY = {
    "llama-70b": {
        "path": "meta-llama/Llama-2-70b-chat-hf",
        "min_gpu_vram": 140,  # GB
        "tokens_per_second": 50,
        "price_per_1m_tokens": 3.0
    },
    "mixtral-8x22b": {
        "path": "mistralai/Mixtral-8x22B-Instruct-v0.1",
        "min_gpu_vram": 180,
        "tokens_per_second": 40,
        "price_per_1m_tokens": 5.0
    },
    "llama-405b": {
        "path": "meta-llama/Llama-3-405b-instruct",
        "min_gpu_vram": 810,
        "tokens_per_second": 30,
        "price_per_1m_tokens": 15.0
    }
}

class GPUNodeManager:
    def __init__(self):
        self.nodes = {}
        self.node_scores = {}
        
    async def register_node(self, node_id: str, capabilities: dict):
        """Register a GPU node with its capabilities"""
        self.nodes[node_id] = {
            "capabilities": capabilities,
            "status": "available",
            "score": 100,
            "tasks_completed": 0,
            "uptime": 0
        }
        await redis_client.hset(f"node:{node_id}", mapping=capabilities)
        
    async def select_best_node(self, model_requirements: dict):
        """Select the best available node for a task"""
        eligible_nodes = []
        
        for node_id, node_data in self.nodes.items():
            if (node_data["status"] == "available" and 
                node_data["capabilities"]["vram"] >= model_requirements["min_gpu_vram"]):
                eligible_nodes.append((node_id, node_data["score"]))
        
        if not eligible_nodes:
            return None
            
        # Sort by score and return best node
        eligible_nodes.sort(key=lambda x: x[1], reverse=True)
        return eligible_nodes[0][0]
    
    async def update_node_score(self, node_id: str, performance_metrics: dict):
        """Update node reliability score based on performance"""
        base_score = self.nodes[node_id]["score"]
        
        # Calculate performance adjustments
        uptime_factor = performance_metrics["uptime"] / 100
        speed_factor = min(1.0, performance_metrics["actual_speed"] / 
                          performance_metrics["expected_speed"])
        accuracy_factor = performance_metrics["accuracy"]
        
        new_score = (base_score * 0.7 + 
                    uptime_factor * 10 + 
                    speed_factor * 10 + 
                    accuracy_factor * 10)
        
        self.nodes[node_id]["score"] = min(100, max(0, new_score))
        
        # Calculate payment adjustment (±10% based on score)
        adjustment = (new_score - 80) / 200  # -10% to +10%
        return adjustment

node_manager = GPUNodeManager()

class PaymentProcessor:
    def __init__(self, contract_address: str):
        self.contract_address = contract_address
        with open("abi/InferencePayment.json", "r") as f:
            self.contract_abi = json.load(f)
        self.contract = w3.eth.contract(
            address=self.contract_address, 
            abi=self.contract_abi
        )
    
    async def verify_payment(self, user_address: str, amount: float):
        """Verify user has paid for inference"""
        balance = self.contract.functions.getBalance(user_address).call()
        return balance >= amount
    
    async def distribute_rewards(
        self, 
        task_id: str, 
        total_amount: float,
        node_id: str,
        performance_adjustment: float
    ):
        """Distribute payments according to tokenomics"""
        # Base distribution: 60% GPU, 20% stakers, 20% treasury
        gpu_payment = total_amount * 0.6 * (1 + performance_adjustment)
        staker_payment = total_amount * 0.2
        treasury_payment = total_amount * 0.2
        
        # Execute on-chain distribution
        tx_hash = self.contract.functions.distributePayment(
            task_id,
            node_id,
            int(gpu_payment * 10**18),
            int(staker_payment * 10**18),
            int(treasury_payment * 10**18)
        ).transact()
        
        return tx_hash

payment_processor = PaymentProcessor(CONTRACT_ADDRESS)

@app.post("/api/inference/generate")
async def generate_text(
    model_id: str,
    prompt: str,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Main inference endpoint"""
    try:
        # Verify user authentication
        user_address = await verify_jwt_token(credentials.credentials)
        
        # Calculate cost
        model_info = MODEL_REGISTRY.get(model_id)
        if not model_info:
            raise HTTPException(404, "Model not found")
        
        estimated_cost = (max_tokens / 1_000_000) * model_info["price_per_1m_tokens"]
        
        # Verify payment
        if not await payment_processor.verify_payment(user_address, estimated_cost):
            raise HTTPException(402, "Insufficient balance")
        
        # Select best GPU node
        node_id = await node_manager.select_best_node(model_info)
        if not node_id:
            raise HTTPException(503, "No available GPU nodes")
        
        # Create task
        task_id = str(uuid.uuid4())
        task_data = {
            "id": task_id,
            "model": model_id,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "node_id": node_id,
            "status": "pending"
        }
        
        # Queue task for processing
        await redis_client.lpush("inference_queue", json.dumps(task_data))
        
        # Wait for result (with timeout)
        result = await wait_for_result(task_id, timeout=120)
        
        if result:
            # Calculate actual cost and distribute payments
            actual_tokens = result["tokens_generated"]
            actual_cost = (actual_tokens / 1_000_000) * model_info["price_per_1m_tokens"]
            
            performance_metrics = {
                "uptime": 99.5,
                "actual_speed": result["tokens_per_second"],
                "expected_speed": model_info["tokens_per_second"],
                "accuracy": 0.98
            }
            
            adjustment = await node_manager.update_node_score(node_id, performance_metrics)
            await payment_processor.distribute_rewards(
                task_id, actual_cost, node_id, adjustment
            )
            
            return {
                "task_id": task_id,
                "result": result["text"],
                "tokens_used": actual_tokens,
                "cost": actual_cost,
                "model": model_id
            }
        else:
            raise HTTPException(500, "Inference timeout")
            
    except Exception as e:
        raise HTTPException(500, str(e))

@app.websocket("/ws/inference/{task_id}")
async def inference_websocket(websocket: WebSocket, task_id: str):
    """WebSocket for streaming inference results"""
    await websocket.accept()
    
    try:
        # Subscribe to task updates
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"task:{task_id}")
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
                
                if data["status"] in ["completed", "failed"]:
                    break
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

# GPU Node endpoints
@app.post("/api/node/register")
async def register_gpu_node(
    wallet_address: str,
    gpu_model: str,
    vram: int,
    bandwidth: float
):
    """Register a new GPU provider node"""
    node_id = f"node_{wallet_address}_{uuid.uuid4().hex[:8]}"
    
    capabilities = {
        "wallet": wallet_address,
        "gpu_model": gpu_model,
        "vram": vram,
        "bandwidth": bandwidth,
        "supported_models": []
    }
    
    # Determine which models this node can run
    for model_id, model_info in MODEL_REGISTRY.items():
        if vram >= model_info["min_gpu_vram"]:
            capabilities["supported_models"].append(model_id)
    
    await node_manager.register_node(node_id, capabilities)
    
    return {
        "node_id": node_id,
        "status": "registered",
        "supported_models": capabilities["supported_models"]
    }

@app.get("/api/network/status")
async def get_network_status():
    """Get current network statistics"""
    total_nodes = len(node_manager.nodes)
    available_nodes = sum(
        1 for n in node_manager.nodes.values() 
        if n["status"] == "available"
    )
    
    total_vram = sum(
        n["capabilities"]["vram"] 
        for n in node_manager.nodes.values()
    )
    
    return {
        "total_nodes": total_nodes,
        "available_nodes": available_nodes,
        "total_vram_gb": total_vram,
        "models_available": list(MODEL_REGISTRY.keys()),
        "average_node_score": sum(
            n["score"] for n in node_manager.nodes.values()
        ) / max(1, total_nodes)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
5.2 WebSocket Service
typescript// services/websocket/server.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const io = new Server({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Redis adapter for horizontal scaling
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return next(new Error('Authentication failed'));
    }
    
    socket.data.userId = user.id;
    socket.data.walletAddress = user.walletAddress;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.userId}`);
  
  // Join user-specific room
  socket.join(`user:${socket.data.userId}`);
  
  // Handle inference streaming
  socket.on('subscribe:inference', async (taskId: string) => {
    socket.join(`task:${taskId}`);
    
    // Send current task status
    const task = await getTaskStatus(taskId);
    socket.emit('task:status', task);
  });
  
  // Handle GPU node monitoring
  socket.on('subscribe:node', async (nodeId: string) => {
    // Verify node ownership
    const node = await prisma.gPUNode.findFirst({
      where: {
        id: nodeId,
        ownerAddress: socket.data.walletAddress
      }
    });
    
    if (node) {
      socket.join(`node:${nodeId}`);
      socket.emit('node:status', await getNodeMetrics(nodeId));
    }
  });
  
  // Handle revenue updates
  socket.on('subscribe:revenue', async () => {
    socket.join(`revenue:${socket.data.walletAddress}`);
    
    // Send current revenue data
    const revenue = await calculateUserRevenue(socket.data.walletAddress);
    socket.emit('revenue:update', revenue);
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

// Emit updates from Redis pub/sub
subClient.subscribe('inference:updates', (message) => {
  const data = JSON.parse(message);
  io.to(`task:${data.taskId}`).emit('inference:token', data);
});

subClient.subscribe('node:metrics', (message) => {
  const data = JSON.parse(message);
  io.to(`node:${data.nodeId}`).emit('node:metrics', data);
});

subClient.subscribe('revenue:updates', (message) => {
  const data = JSON.parse(message);
  io.to(`revenue:${data.walletAddress}`).emit('revenue:update', data);
});

io.listen(3001);

6. Smart Contracts
6.1 Main Token Contract
solidity// contracts/FARToken.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract FARToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public rewardsEarned;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% base APY (adjustable)
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("Far Labs Token", "FAR") {
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    function stake(uint256 _amount) external whenNotPaused {
        require(_amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Calculate pending rewards before staking
        if (stakingBalance[msg.sender] > 0) {
            uint256 pending = calculateRewards(msg.sender);
            rewardsEarned[msg.sender] += pending;
        }
        
        _transfer(msg.sender, address(this), _amount);
        stakingBalance[msg.sender] += _amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake(uint256 _amount) external {
        require(_amount > 0, "Cannot unstake 0 tokens");
        require(stakingBalance[msg.sender] >= _amount, "Insufficient staked balance");
        
        // Calculate rewards
        uint256 pending = calculateRewards(msg.sender);
        rewardsEarned[msg.sender] += pending;
        
        stakingBalance[msg.sender] -= _amount;
        totalStaked -= _amount;
        
        _transfer(address(this), msg.sender, _amount);
        
        if (stakingBalance[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
        } else {
            stakingTimestamp[msg.sender] = block.timestamp;
        }
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function claimRewards() external {
        uint256 pending = calculateRewards(msg.sender);
        uint256 total = rewardsEarned[msg.sender] + pending;
        
        require(total > 0, "No rewards to claim");
        
        rewardsEarned[msg.sender] = 0;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        _mint(msg.sender, total);
        
        emit RewardsClaimed(msg.sender, total);
    }
    
    function calculateRewards(address _user) public view returns (uint256) {
        if (stakingBalance[_user] == 0) {
            return 0;
        }
        
        uint256 stakingDuration = block.timestamp - stakingTimestamp[_user];
        uint256 rewards = (stakingBalance[_user] * rewardRate * stakingDuration) / (365 days * 10000);
        
        return rewards;
    }
    
    function setRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 10000, "Rate too high"); // Max 100% APY
        rewardRate = _newRate;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
6.2 Inference Payment Contract
solidity// contracts/InferencePayment.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

interface IFARToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract InferencePayment is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant NODE_ROLE = keccak256("NODE_ROLE");
    
    IFARToken public farToken;
    AggregatorV3Interface public priceFeed;
    
    struct Task {
        address user;
        address node;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        bool distributed;
    }
    
    struct NodeInfo {
        address owner;
        uint256 totalEarned;
        uint256 tasksCompleted;
        uint256 reliability; // 0-100 score
        bool active;
    }
    
    mapping(bytes32 => Task) public tasks;
    mapping(address => NodeInfo) public nodes;
    mapping(address => uint256) public userBalances;
    
    uint256 public constant NODE_SHARE = 60; // 60%
    uint256 public constant STAKER_SHARE = 20; // 20%
    uint256 public constant TREASURY_SHARE = 20; // 20%
    
    address public stakingContract;
    address public treasury;
    
    event TaskCreated(bytes32 taskId, address user, uint256 amount);
    event TaskCompleted(bytes32 taskId, address node, uint256 nodePayment);
    event NodeRegistered(address node, address owner);
    event NodeRatingUpdated(address node, uint256 newRating);
    
    constructor(
        address _farToken,
        address _stakingContract,
        address _treasury,
        address _priceFeed
    ) {
        farToken = IFARToken(_farToken);
        stakingContract = _stakingContract;
        treasury = _treasury;
        priceFeed = AggregatorV3Interface(_priceFeed);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(
            farToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        userBalances[msg.sender] += _amount;
    }
    
    function createTask(
        bytes32 _taskId,
        uint256 _estimatedCost
    ) external nonReentrant {
        require(userBalances[msg.sender] >= _estimatedCost, "Insufficient balance");
        require(tasks[_taskId].user == address(0), "Task already exists");
        
        tasks[_taskId] = Task({
            user: msg.sender,
            node: address(0),
            amount: _estimatedCost,
            timestamp: block.timestamp,
            completed: false,
            distributed: false
        });
        
        userBalances[msg.sender] -= _estimatedCost;
        
        emit TaskCreated(_taskId, msg.sender, _estimatedCost);
    }
    
    function completeTask(
        bytes32 _taskId,
        address _node,
        uint256 _actualCost,
        uint256 _performanceScore
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.user != address(0), "Task does not exist");
        require(!task.completed, "Task already completed");
        require(nodes[_node].active, "Node not active");
        
        task.completed = true;
        task.node = _node;
        
        // Calculate performance adjustment (±10% based on score)
        uint256 adjustment = 100;
        if (_performanceScore > 80) {
            adjustment = 100 + ((_performanceScore - 80) / 2); // Up to +10%
        } else if (_performanceScore < 80) {
            adjustment = 100 - ((80 - _performanceScore) / 2); // Up to -10%
        }
        
        // Calculate distributions
        uint256 nodePayment = (_actualCost * NODE_SHARE * adjustment) / 10000;
        uint256 stakerPayment = (_actualCost * STAKER_SHARE) / 100;
        uint256 treasuryPayment = (_actualCost * TREASURY_SHARE) / 100;
        
        // Refund excess to user if actual < estimated
        if (_actualCost < task.amount) {
            userBalances[task.user] += (task.amount - _actualCost);
        }
        
        // Distribute payments
        require(farToken.transfer(_node, nodePayment), "Node payment failed");
        require(farToken.transfer(stakingContract, stakerPayment), "Staker payment failed");
        require(farToken.transfer(treasury, treasuryPayment), "Treasury payment failed");
        
        // Update node stats
        nodes[_node].totalEarned += nodePayment;
        nodes[_node].tasksCompleted++;
        nodes[_node].reliability = (_performanceScore + nodes[_node].reliability) / 2;
        
        task.distributed = true;
        
        emit TaskCompleted(_taskId, _node, nodePayment);
    }
    
    function registerNode(address _owner) external onlyRole(ORACLE_ROLE) {
        require(!nodes[_owner].active, "Node already registered");
        
        nodes[_owner] = NodeInfo({
            owner: _owner,
            totalEarned: 0,
            tasksCompleted: 0,
            reliability: 80, // Start with base score
            active: true
        });
        
        _grantRole(NODE_ROLE, _owner);
        
        emit NodeRegistered(_owner, _owner);
    }
    
    function updateNodeRating(
        address _node,
        uint256 _newRating
    ) external onlyRole(ORACLE_ROLE) {
        require(nodes[_node].active, "Node not active");
        require(_newRating <= 100, "Invalid rating");
        
        nodes[_node].reliability = _newRating;
        
        emit NodeRatingUpdated(_node, _newRating);
    }
    
    function withdraw(uint256 _amount) external nonReentrant {
        require(userBalances[msg.sender] >= _amount, "Insufficient balance");
        
        userBalances[msg.sender] -= _amount;
        require(farToken.transfer(msg.sender, _amount), "Transfer failed");
    }
    
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}

7. Database Schema
7.1 PostgreSQL Schema
sql-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    tier VARCHAR(20) DEFAULT 'basic'
);

-- GPU Nodes table
CREATE TABLE gpu_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id VARCHAR(100) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    gpu_model VARCHAR(100),
    vram_gb INTEGER,
    cuda_cores INTEGER,
    bandwidth_mbps DECIMAL(10, 2),
    location_country VARCHAR(2),
    location_region VARCHAR(100),
    status VARCHAR(20) DEFAULT 'offline',
    reliability_score DECIMAL(5, 2) DEFAULT 80.00,
    tasks_completed INTEGER DEFAULT 0,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    uptime_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_address) REFERENCES users(wallet_address)
);

-- Inference Tasks table
CREATE TABLE inference_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    node_id UUID,
    model_name VARCHAR(100) NOT NULL,
    prompt TEXT,
    max_tokens INTEGER,
    temperature DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'pending',
    tokens_generated INTEGER,
    cost_far DECIMAL(20, 8),
    cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    response_time_ms INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (node_id) REFERENCES gpu_nodes(id)
);

-- Staking Records table
CREATE TABLE staking_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    lock_period_days INTEGER NOT NULL,
    apy_at_stake DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'active',
    staked_at TIMESTAMP DEFAULT NOW(),
    unlock_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    rewards_earned DECIMAL(20, 8) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Revenue Streams table
CREATE TABLE revenue_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_type VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    amount_far DECIMAL(20, 8),
    amount_usd DECIMAL(10, 4),
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_gpu_nodes_status ON gpu_nodes(status);
CREATE INDEX idx_gpu_nodes_owner ON gpu_nodes(owner_address);
CREATE INDEX idx_tasks_user ON inference_tasks(user_id);
CREATE INDEX idx_tasks_status ON inference_tasks(status);
CREATE INDEX idx_staking_user ON staking_records(user_id);
CREATE INDEX idx_staking_status ON staking_records(status);
CREATE INDEX idx_revenue_user ON revenue_streams(user_id);
CREATE INDEX idx_revenue_type ON revenue_streams(stream_type);
7.2 MongoDB Schema (for logs and analytics)
javascript// Inference Logs Collection
{
  _id: ObjectId(),
  taskId: "uuid",
  userId: "uuid",
  nodeId: "uuid",
  model: "llama-70b",
  prompt: "...",
  response: "...",
  metadata: {
    tokensUsed: 1500,
    latency: 2340,
    temperature: 0.7,
    topP: 0.9
  },
  timestamps: {
    created: ISODate(),
    started: ISODate(),
    completed: ISODate()
  },
  performance: {
    tokensPerSecond: 45.3,
    firstTokenLatency: 340,
    totalLatency: 2340
  }
}

// Network Metrics Collection
{
  _id: ObjectId(),
  timestamp: ISODate(),
  metrics: {
    totalNodes: 1543,
    activeNodes: 1205,
    totalVRAM: 24576, // GB
    utilizationRate: 0.73,
    averageReliability: 87.3,
    tasksInQueue: 45,
    tasksCompleted24h: 15234
  },
  modelAvailability: {
    "llama-70b": 453,
    "mixtral-8x22b": 234,
    "llama-405b": 12
  }
}

// User Activity Collection
{
  _id: ObjectId(),
  userId: "uuid",
  date: ISODate(),
  activities: [
    {
      type: "inference",
      count: 45,
      tokensUsed: 234500,
      costFAR: 123.45
    },
    {
      type: "staking",
      amount: 10000,
      action: "stake"
    }
  ],
  dailyStats: {
    inferenceRequests: 45,
    totalSpent: 234.56,
    rewardsEarned: 12.34
  }
}

8. Security Architecture
8.1 Security Layers
yamlInfrastructure Security:
  Network:
    - VPC with private subnets
    - Security groups with least privilege
    - NACLs for additional protection
    - VPN for administrative access
  
  Data:
    - Encryption at rest (RDS, S3)
    - Encryption in transit (TLS 1.3)
    - AWS KMS for key management
    - Secrets Manager for credentials
  
  Access:
    - IAM roles with minimal permissions
    - MFA for all admin accounts
    - CloudTrail for audit logging
    - Session Manager for EC2 access

Application Security:
  Authentication:
    - JWT with short expiration (15 min)
    - Refresh tokens in secure cookies
    - Web3 wallet signatures