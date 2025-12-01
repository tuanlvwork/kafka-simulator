

import React, { useState, useEffect, useRef } from 'react';
import { GameState, NodeType, NodeEntity, Connection, ZkLogEntry, MetadataRecord } from './types';
import { ControlPanel } from './components/ControlPanel';
import { AiTutor } from './components/AiTutor';
import { NodeComponent } from './components/NodeComponent';
import { ClusterHud } from './components/ClusterHud';
import { ArchitectureInfoModal } from './components/ArchitectureInfoModal';

// Utility for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const BROKERS = [101, 102, 103]; // Simulated broker IDs

// Coordinates for the Brokers in the HUD (Estimated based on CSS)
const BROKER_COORDS: Record<number, { x: number, y: number }> = {
    101: { x: 248, y: 100 }, 
    102: { x: 356, y: 100 }, 
    103: { x: 464, y: 100 }, 
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    nodes: [],
    connections: [],
    totalMessagesProcessed: 0,
    globalLag: 0,
    isRunning: false,
    gameStatus: 'IDLE',
    level: 1,
    score: 0,
    clusterMode: 'ZOOKEEPER',
    isZookeeperOffline: false,
    activeControllerId: null,
    zkLogs: [],
    raftLogs: []
  });

  const [brokerStates, setBrokerStates] = useState<Record<number, boolean>>({
      101: true,
      102: true,
      103: true
  });

  const [showArchModal, setShowArchModal] = useState(false);

  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // --- Helpers ---

  const addZkLog = (action: ZkLogEntry['action'], path: string, data?: string) => {
      setGameState(prev => ({
          ...prev,
          zkLogs: [{
              id: generateId(),
              timestamp: Date.now(),
              action,
              path,
              data
          }, ...prev.zkLogs].slice(0, 10) // Keep last 10 logs
      }));
  };

  const appendMetadataRecord = (type: MetadataRecord['type'], key: string, value: string) => {
      setGameState(prev => {
          const nextOffset = prev.raftLogs.length;
          return {
              ...prev,
              raftLogs: [...prev.raftLogs, {
                  offset: nextOffset,
                  timestamp: Date.now(),
                  type,
                  key,
                  value
              }]
          };
      });
  };

  // Pick N unique brokers for replication
  const pickBrokers = (count: number, preferredFirst?: number): number[] => {
    let pool = [...BROKERS];
    if (preferredFirst) {
        pool = pool.filter(id => id !== preferredFirst);
        // Shuffle rest
        pool.sort(() => Math.random() - 0.5);
        return [preferredFirst, ...pool.slice(0, count - 1)];
    }
    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, count);
  };

  // Kafka Logic: Rebalance Partitions among Consumers
  const triggerRebalance = (nodes: NodeEntity[], connections: Connection[]): NodeEntity[] => {
    // 1. Identify Topology
    const topics = nodes.filter(n => n.type === NodeType.TOPIC);
    
    let newNodes = [...nodes];

    topics.forEach(topic => {
        // Find consumers connected to this topic
        const topicConsumersIndices = newNodes
            .map((n, idx) => ({ n, idx }))
            .filter(({ n }) => 
                n.type === NodeType.CONSUMER && 
                connections.some(c => c.sourceId === topic.id && c.targetId === n.id)
            );
        
        const consumerCount = topicConsumersIndices.length;
        const partitionCount = topic.partitions || 1;

        // Reset assignments first
        topicConsumersIndices.forEach(({ idx }) => {
            newNodes[idx] = { 
                ...newNodes[idx], 
                assignedPartitions: [], 
                isRebalancing: true, // Start visual rebalance
                isIdle: true 
            };
        });

        if (consumerCount > 0) {
            // Distribute partitions (Round Robin)
            for (let i = 0; i < partitionCount; i++) {
                const assignedConsumerIdx = i % consumerCount; // The key Kafka logic
                const globalIndex = topicConsumersIndices[assignedConsumerIdx].idx;
                
                const currentAssigned = newNodes[globalIndex].assignedPartitions || [];
                newNodes[globalIndex] = {
                    ...newNodes[globalIndex],
                    assignedPartitions: [...currentAssigned, i],
                    isIdle: false
                };
            }
        }
    });

    return newNodes;
  };

  // Clear rebalancing visual state after delay
  useEffect(() => {
    const rebalancingNodes = gameState.nodes.filter(n => n.isRebalancing);
    if (rebalancingNodes.length > 0) {
        const timer = setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => ({ ...n, isRebalancing: false }))
            }));
        }, 1500); // 1.5s rebalance pause
        return () => clearTimeout(timer);
    }
  }, [gameState.nodes]);

  // --- CONTROLLER ELECTION LOGIC ---
  useEffect(() => {
      // Logic split based on mode
      if (gameState.clusterMode === 'ZOOKEEPER') {
          // If ZK is offline, Controller session expires
          if (gameState.isZookeeperOffline) {
              if (gameState.activeControllerId !== null) {
                  setGameState(prev => ({ ...prev, activeControllerId: null }));
              }
              return;
          }
      } 

      // Common Election Logic (ZK or KRaft Quorum)
      const currentController = gameState.activeControllerId;
      const isControllerAlive = currentController ? brokerStates[currentController] : false;

      if (!isControllerAlive) {
          // Trigger Election
          const availableBrokers = BROKERS.filter(id => brokerStates[id]);
          
          if (availableBrokers.length > 0) {
              // Election Mechanism:
              // ZK: First to register node wins
              // KRaft: Quorum vote (simplified here to lowest ID wins)
              
              const newController = availableBrokers[0]; 
              if (newController !== currentController) {
                  setGameState(prev => ({ ...prev, activeControllerId: newController }));
                  
                  if (gameState.clusterMode === 'ZOOKEEPER') {
                      addZkLog('ELECT', '/controller', `broker_${newController}`);
                  } else {
                      // KRaft specific log
                      // Note: In real KRaft, the election happens via Vote requests, then a new epoch starts.
                      // We visualize this as a Broker Change in metadata
                      appendMetadataRecord('BROKER_CHANGE', 'Leader', `New Controller ${newController}`);
                  }
              }
          } else {
              setGameState(prev => ({ ...prev, activeControllerId: null }));
          }
      }
  }, [brokerStates, gameState.isZookeeperOffline, gameState.clusterMode, gameState.activeControllerId]);


  // --- Game Loop ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (gameState.isRunning && gameState.gameStatus !== 'GAME_OVER') {
      intervalId = setInterval(() => {
        setGameState(prev => {
            // Stop-the-world rebalance simulation
            const isSystemRebalancing = prev.nodes.some(n => n.isRebalancing);
            if (isSystemRebalancing) {
                return prev;
            }

            let processedTick = 0;
            
            const nodeUpdates = prev.nodes.map(node => {
                const newNode = { ...node };

                // --- REPLICATION & FAILOVER LOGIC ---
                if (newNode.type === NodeType.TOPIC) {
                    const rf = newNode.replicationFactor || 1;
                    const replicas = newNode.replicas || [];
                    const currentLeader = newNode.activeLeaderId;

                    // Check if current leader is alive
                    const isLeaderAlive = currentLeader ? brokerStates[currentLeader] : false;

                    if (isLeaderAlive) {
                        newNode.isOffline = false;
                    } else {
                        // LEADER DOWN! Attempt Failover
                        const controllerIsActive = prev.activeControllerId !== null;
                        
                        // Failover Requirement:
                        // ZK: Needs ZK + Controller
                        // KRaft: Needs Controller (which needs Quorum)
                        
                        if (!controllerIsActive) {
                            newNode.isOffline = true;
                        } else {
                            // Find a replica that is on an ONLINE broker
                            const newLeaderCandidate = replicas.find(rId => brokerStates[rId]);
                            
                            if (newLeaderCandidate) {
                                // Election Success
                                if (newNode.activeLeaderId !== newLeaderCandidate) {
                                    if (prev.clusterMode === 'KRAFT') {
                                         appendMetadataRecord('PARTITION_CHANGE', `Topic:${node.name}`, `New Leader: ${newLeaderCandidate}`);
                                    }
                                }
                                newNode.activeLeaderId = newLeaderCandidate;
                                newNode.brokerId = newLeaderCandidate;
                                newNode.isOffline = false;
                            } else {
                                // All Replicas Down -> System Failure
                                newNode.isOffline = true;
                            }
                        }
                    }

                    // --- PROCESSING LOGIC ---
                    // If offline, no inflow or outflow
                    if (newNode.isOffline) {
                        return newNode;
                    }

                    // 1. Inflow
                    const producers = prev.nodes.filter(n => 
                        n.type === NodeType.PRODUCER && 
                        prev.connections.some(c => c.sourceId === n.id && c.targetId === node.id)
                    );
                    const inflow = producers.reduce((sum, p) => sum + (p.productionRate || 0), 0);

                    // 2. Outflow (Processing)
                    const connectedConsumers = prev.nodes.filter(n => 
                        n.type === NodeType.CONSUMER && 
                        prev.connections.some(c => c.sourceId === node.id && c.targetId === n.id)
                    );
                    
                    let totalProcessingCapacity = 0;
                    connectedConsumers.forEach(c => {
                        if (c.assignedPartitions && c.assignedPartitions.length > 0) {
                            totalProcessingCapacity += (c.processingRate || 0);
                        }
                    });

                    // Update Lag
                    let currentTopicLag = (newNode.currentLag || 0);
                    currentTopicLag += (inflow * 0.5); 
                    
                    const actualConsumed = Math.min(currentTopicLag, totalProcessingCapacity * 0.5);
                    currentTopicLag -= actualConsumed;

                    newNode.currentLag = Math.max(0, currentTopicLag);
                    processedTick += Math.floor(actualConsumed * 10);
                }

                return newNode;
            });

            // Calculate Global Lag
            const topics = nodeUpdates.filter(n => n.type === NodeType.TOPIC && !n.isOffline);
            const avgLag = topics.length > 0 
                ? topics.reduce((sum, t) => sum + (t.currentLag || 0), 0) / topics.length 
                : 0;
            
            let status = prev.gameStatus;
            if (avgLag >= 100) status = 'GAME_OVER';

            return {
                ...prev,
                nodes: nodeUpdates,
                globalLag: avgLag,
                totalMessagesProcessed: prev.totalMessagesProcessed + processedTick,
                gameStatus: status,
                isRunning: status === 'PLAYING'
            };
        });
      }, 500); 
    }

    return () => clearInterval(intervalId);
  }, [gameState.isRunning, gameState.gameStatus, brokerStates, gameState.isZookeeperOffline, gameState.clusterMode, gameState.activeControllerId]);


  // --- Actions ---

  const addNode = (type: NodeType) => {
    // Check Metadata Health
    if (type === NodeType.TOPIC) {
        const isMetadataDown = gameState.clusterMode === 'ZOOKEEPER' 
            ? gameState.isZookeeperOffline 
            : gameState.activeControllerId === null; // No quorum/controller

        if (isMetadataDown) {
            const sysName = gameState.clusterMode === 'ZOOKEEPER' ? 'ZooKeeper' : 'KRaft Quorum';
            alert(`CRITICAL ERROR: Connection to ${sysName} lost. Cannot create new Topics.`);
            return;
        }
    }

    const count = gameState.nodes.length;
    let defaultX = 100;
    if (type === NodeType.TOPIC) defaultX = 400;
    if (type === NodeType.CONSUMER) defaultX = 700;

    const randomBrokerId = BROKERS[Math.floor(Math.random() * BROKERS.length)];
    const initialRF = 1;

    const newNode: NodeEntity = {
      id: generateId(),
      type,
      name: `${type === NodeType.TOPIC ? 'Topic' : type === NodeType.CONSUMER ? 'Consumer' : 'Producer'} ${count + 1}`,
      x: defaultX + (Math.random() * 50),
      y: 250 + (count * 20),
      productionRate: type === NodeType.PRODUCER ? 8 : 0,
      processingRate: type === NodeType.CONSUMER ? 5 : 0,
      currentLag: 0,
      partitions: type === NodeType.TOPIC ? 1 : undefined,
      // Init Replication Data
      replicationFactor: type === NodeType.TOPIC ? initialRF : undefined,
      brokerId: type === NodeType.TOPIC ? randomBrokerId : undefined, // Legacy support
      activeLeaderId: type === NodeType.TOPIC ? randomBrokerId : undefined,
      replicas: type === NodeType.TOPIC ? [randomBrokerId] : undefined,
      
      assignedPartitions: [],
      isRebalancing: false,
      isIdle: type === NodeType.CONSUMER,
      isOffline: false,
      groupId: type === NodeType.CONSUMER ? 'CG-1' : undefined 
    };

    setGameState(prev => {
        const nextNodesRaw = [...prev.nodes, newNode];
        const nextConnections = [...prev.connections];

        // Auto-connect logic
        if (type === NodeType.TOPIC) {
            if (prev.clusterMode === 'ZOOKEEPER') {
                addZkLog('REGISTER', `/config/topics/${newNode.name}`);
            } else {
                appendMetadataRecord('TOPIC_CONFIG', newNode.name, `Created with RF: ${initialRF}, P: 1`);
            }

            const freeProducers = prev.nodes.filter(n => n.type === NodeType.PRODUCER && !prev.connections.some(c => c.sourceId === n.id));
            if (freeProducers.length > 0) {
                nextConnections.push({ id: generateId(), sourceId: freeProducers[0].id, targetId: newNode.id });
            }
        }
        if (type === NodeType.CONSUMER) {
             const availableTopics = prev.nodes.filter(n => n.type === NodeType.TOPIC);
             if (availableTopics.length > 0) {
                 nextConnections.push({ id: generateId(), sourceId: availableTopics[availableTopics.length-1].id, targetId: newNode.id });
             }
        }
        if (type === NodeType.PRODUCER) {
             const availableTopics = prev.nodes.filter(n => n.type === NodeType.TOPIC);
             if (availableTopics.length > 0) {
                 nextConnections.push({ id: generateId(), sourceId: newNode.id, targetId: availableTopics[0].id });
             }
        }

        const rebalancedNodes = triggerRebalance(nextNodesRaw, nextConnections);

        return {
            ...prev,
            nodes: rebalancedNodes,
            connections: nextConnections
        };
    });
  };

  const deleteNode = (id: string) => {
      setGameState(prev => {
          const nodeToDelete = prev.nodes.find(n => n.id === id);
          if (nodeToDelete?.type === NodeType.TOPIC) {
              if (prev.clusterMode === 'ZOOKEEPER') {
                  addZkLog('DELETE', `/config/topics/${nodeToDelete.name}`);
              } else {
                  appendMetadataRecord('TOPIC_CONFIG', nodeToDelete.name, 'Deleted');
              }
          }

          const remainingNodes = prev.nodes.filter(n => n.id !== id);
          const remainingConnections = prev.connections.filter(c => c.sourceId !== id && c.targetId !== id);
          const rebalancedNodes = triggerRebalance(remainingNodes, remainingConnections);

          return {
              ...prev,
              nodes: rebalancedNodes,
              connections: remainingConnections
          };
      });
  };

  const updateNode = (id: string, updates: Partial<NodeEntity>) => {
    setGameState(prev => {
        let newNodes = prev.nodes.map(n => {
            if (n.id !== id) return n;
            
            const updatedNode = { ...n, ...updates };

            if (updates.replicationFactor !== undefined && n.type === NodeType.TOPIC) {
                // Cannot update RF if Metadata service is down
                if (prev.clusterMode === 'ZOOKEEPER' && prev.isZookeeperOffline) return n;
                if (prev.clusterMode === 'KRAFT' && !prev.activeControllerId) return n;

                const newRF = updates.replicationFactor;
                const currentLeader = n.activeLeaderId || BROKERS[0];
                updatedNode.replicas = pickBrokers(newRF, currentLeader);

                if (prev.clusterMode === 'KRAFT') {
                    appendMetadataRecord('TOPIC_CONFIG', n.name, `Updated RF to ${newRF}`);
                }
            }

            if (updates.partitions !== undefined && prev.clusterMode === 'KRAFT' && n.type === NodeType.TOPIC) {
                 appendMetadataRecord('TOPIC_CONFIG', n.name, `Updated Partitions to ${updates.partitions}`);
            }

            return updatedNode;
        });
        
        if (updates.partitions !== undefined) {
            newNodes = triggerRebalance(newNodes, prev.connections);
        }

        return { ...prev, nodes: newNodes };
    });
  };

  const handleReset = () => {
    setGameState(prev => ({
      nodes: [],
      connections: [],
      totalMessagesProcessed: 0,
      globalLag: 0,
      isRunning: false,
      gameStatus: 'IDLE',
      level: 1,
      score: 0,
      clusterMode: prev.clusterMode,
      isZookeeperOffline: false,
      activeControllerId: null,
      zkLogs: [],
      raftLogs: []
    }));
    setBrokerStates({ 101: true, 102: true, 103: true });
  };

  const handleRetry = () => {
      setGameState(prev => ({
          ...prev,
          globalLag: 0,
          totalMessagesProcessed: 0,
          gameStatus: 'IDLE',
          isRunning: false,
          isZookeeperOffline: false, 
          zkLogs: [],
          nodes: prev.nodes.map(n => ({
              ...n,
              currentLag: 0,
              isOffline: false,
              isRebalancing: false
          }))
      }));
      setBrokerStates({ 101: true, 102: true, 103: true });
  };

  const togglePause = () => {
      if (gameState.gameStatus === 'GAME_OVER') return;
      setGameState(prev => ({
          ...prev,
          isRunning: !prev.isRunning,
          gameStatus: !prev.isRunning ? 'PLAYING' : 'IDLE'
      }));
  };

  const toggleClusterMode = () => {
      setGameState(prev => ({
          ...prev,
          clusterMode: prev.clusterMode === 'ZOOKEEPER' ? 'KRAFT' : 'ZOOKEEPER',
          isZookeeperOffline: false,
          zkLogs: [],
          raftLogs: [],
          activeControllerId: null // Reset controller on mode switch
      }));
  };

  const toggleBroker = (id: number) => {
      const isNowOffline = brokerStates[id]; // It is currently online, so it will be offline
      
      setBrokerStates(prev => ({
          ...prev,
          [id]: !prev[id]
      }));

      // Logging logic
      if (gameState.clusterMode === 'ZOOKEEPER') {
          if (isNowOffline) {
              addZkLog('DELETE', `/brokers/ids/${id}`);
          } else {
              addZkLog('REGISTER', `/brokers/ids/${id}`, `{"host":"broker-${id}"}`);
          }
      } else {
          // In KRaft, connection loss is detected by heartbeats in the log
          if (isNowOffline) {
              appendMetadataRecord('BROKER_CHANGE', `Broker ${id}`, 'Missed Heartbeat (Offline)');
          } else {
              appendMetadataRecord('BROKER_CHANGE', `Broker ${id}`, 'Rejoined Quorum');
          }
      }
  };

  const toggleZookeeper = () => {
      if (gameState.clusterMode === 'KRAFT') return;
      setGameState(prev => ({
          ...prev,
          isZookeeperOffline: !prev.isZookeeperOffline
      }));
  };

  // --- Drag and Drop Handlers ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
      if (gameState.gameStatus === 'GAME_OVER') return;
      
      const node = gameState.nodes.find(n => n.id === id);
      if (node) {
          setDraggingId(id);
          dragOffset.current = {
              x: e.clientX - node.x,
              y: e.clientY - node.y
          };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!draggingId) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      setGameState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => 
              n.id === draggingId ? { ...n, x: newX, y: newY } : n
          )
      }));
  };

  const handleMouseUp = () => {
      setDraggingId(null);
  };

  // --- RENDER HELPERS ---

  const renderInfrastructureLinks = () => {
     return gameState.nodes
        .filter(n => n.type === NodeType.TOPIC && n.replicas && n.replicas.length > 0)
        .flatMap(node => {
            const x1 = node.x + 80; 
            const y1 = node.y;      

            return (node.replicas || []).map(replicaId => {
                const brokerPos = BROKER_COORDS[replicaId];
                if (!brokerPos) return null;
                
                const isOnline = brokerStates[replicaId];
                const isLeader = node.activeLeaderId === replicaId;

                const x2 = brokerPos.x;
                const y2 = brokerPos.y;

                let strokeColor = isLeader ? "#60a5fa" : "#4b5563"; 
                if (!isOnline) strokeColor = "#7f1d1d"; 

                let strokeWidth = isLeader ? "2" : "1";
                let strokeDash = isLeader ? "0" : "4,4";
                let opacity = isLeader ? "0.8" : "0.3";

                return (
                    <g key={`infra-${node.id}-${replicaId}`}>
                        <path 
                            d={`M${x1},${y1} C${x1},${y1-50} ${x2},${y2+50} ${x2},${y2}`}
                            stroke={strokeColor} 
                            strokeWidth={strokeWidth} 
                            strokeDasharray={strokeDash}
                            fill="none"
                            opacity={opacity}
                        />
                        {isLeader && isOnline && (
                             <circle cx={x2} cy={y2} r="3" fill="#3b82f6" className="animate-pulse" />
                        )}
                    </g>
                );
            });
        });
  };

  const renderConnections = () => {
    return gameState.connections.map(conn => {
        const source = gameState.nodes.find(n => n.id === conn.sourceId);
        const target = gameState.nodes.find(n => n.id === conn.targetId);
        if (!source || !target) return null;

        const isBroken = source.isOffline || target.isOffline;

        const x1 = source.x + 80; 
        const y1 = source.y + 80;
        const x2 = target.x + 80;
        const y2 = target.y + 80;

        return (
            <g key={conn.id}>
                <line 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke={isBroken ? "#451a1a" : "#52525b"} 
                    strokeWidth="2" 
                />
                {gameState.isRunning && !source.isRebalancing && !target.isRebalancing && !isBroken && (
                    <circle r="4" fill="#E86D23">
                        <animateMotion 
                            dur={`${Math.max(0.5, 2 - (gameState.totalMessagesProcessed/1000))}s`} 
                            repeatCount="indefinite" 
                            path={`M${x1},${y1} L${x2},${y2}`} 
                        />
                    </circle>
                )}
            </g>
        );
    });
  };

  return (
    <div 
        className="flex h-screen w-screen bg-black overflow-hidden font-sans text-gray-200 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
      <ControlPanel 
        onAddNode={addNode} 
        onReset={handleReset} 
        onRetry={handleRetry}
        onTogglePause={togglePause} 
        isRunning={gameState.isRunning}
        gameStatus={gameState.gameStatus}
        clusterMode={gameState.clusterMode}
        onToggleClusterMode={toggleClusterMode}
      />

      <div className="flex-1 relative bg-kafka-dark overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{ 
                 backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
             }}>
        </div>

        {/* Cluster Infrastructure Layer */}
        <ClusterHud 
            mode={gameState.clusterMode} 
            topicCount={gameState.nodes.filter(n => n.type === NodeType.TOPIC).length} 
            brokerStates={brokerStates}
            isZookeeperOffline={gameState.isZookeeperOffline}
            activeControllerId={gameState.activeControllerId}
            zkLogs={gameState.zkLogs}
            raftLogs={gameState.raftLogs}
            totalProcessed={gameState.totalMessagesProcessed}
            onToggleBroker={toggleBroker}
            onToggleZookeeper={toggleZookeeper}
            onShowInfo={() => setShowArchModal(true)}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderInfrastructureLinks()}
            {renderConnections()}
        </svg>

        {gameState.nodes.map(node => (
            <NodeComponent 
                key={node.id} 
                node={node} 
                onClick={(id) => {}} 
                onUpdate={updateNode}
                onDelete={deleteNode}
                onMouseDown={handleMouseDown}
            />
        ))}

        {gameState.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-40 mt-32">
                    <h1 className="text-4xl font-bold mb-2">StreamWeaver</h1>
                    <p className="mb-4">Drag & Drop components to build your pipeline.</p>
                </div>
            </div>
        )}
      </div>

      <AiTutor gameState={gameState} />
      
      <ArchitectureInfoModal 
          isOpen={showArchModal} 
          onClose={() => setShowArchModal(false)}
          activeMode={gameState.clusterMode}
      />
    </div>
  );
};

export default App;