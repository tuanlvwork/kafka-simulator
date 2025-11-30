
export enum NodeType {
  PRODUCER = 'PRODUCER',
  TOPIC = 'TOPIC',
  CONSUMER = 'CONSUMER'
}

export type ClusterMode = 'ZOOKEEPER' | 'KRAFT';

export interface NodeEntity {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  // Game stats
  productionRate?: number; // For producers (msgs/sec)
  processingRate?: number; // For consumers (msgs/sec)
  currentLag?: number;     // For topics (buffered messages)
  partitions?: number;     // For topics
  
  // Infrastructure
  brokerId?: number;       // Which broker hosts this topic (e.g., 101, 102)

  // New fields for Partitioning & Rebalancing
  assignedPartitions?: number[]; // List of partition IDs (0, 1, 2...) assigned to this consumer
  isRebalancing?: boolean;       // Visual state for rebalancing pause
  isIdle?: boolean;              // If consumer has no partitions assigned
  
  // Consumer Group
  groupId?: string;              // e.g., "CG-1"
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface GameState {
  nodes: NodeEntity[];
  connections: Connection[];
  totalMessagesProcessed: number;
  globalLag: number;
  isRunning: boolean;
  gameStatus: 'IDLE' | 'PLAYING' | 'GAME_OVER';
  level: number;
  score: number;
  clusterMode: ClusterMode; // Zookeeper or KRaft
}

export interface SimulationMetrics {
  throughput: number;
  lagTrend: 'UP' | 'DOWN' | 'STABLE';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'INFO' | 'ERROR' | 'SUCCESS' | 'AI';
}