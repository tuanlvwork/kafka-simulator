

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
  brokerId?: number;       // Keep for backward compatibility/simplicity (Primary Leader)
  
  // Replication Logic
  replicationFactor?: number;   // 1, 2, or 3
  replicas?: number[];          // List of Broker IDs hosting this topic [101, 102]
  activeLeaderId?: number;      // The broker currently serving data. Must be in replicas.

  // New fields for Partitioning & Rebalancing
  assignedPartitions?: number[]; // List of partition IDs (0, 1, 2...) assigned to this consumer
  isRebalancing?: boolean;       // Visual state for rebalancing pause
  isIdle?: boolean;              // If consumer has no partitions assigned
  isOffline?: boolean;           // If the hosting broker (all replicas) are down
  
  // Consumer Group
  groupId?: string;              // e.g., "CG-1"
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface ZkLogEntry {
  id: string;
  timestamp: number;
  action: 'REGISTER' | 'ELECT' | 'UPDATE' | 'DELETE';
  path: string;
  data?: string;
}

export interface MetadataRecord {
  offset: number;
  timestamp: number;
  type: 'BROKER_CHANGE' | 'TOPIC_CONFIG' | 'PARTITION_CHANGE';
  key: string;
  value: string;
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
  isZookeeperOffline: boolean; // Simulation of ZK failure
  activeControllerId: number | null; // The broker elected as Controller
  zkLogs: ZkLogEntry[]; // Recent ZK operations
  raftLogs: MetadataRecord[]; // KRaft internal metadata topic logs
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