
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, NodeType, NodeEntity, Connection } from './types';
import { ControlPanel } from './components/ControlPanel';
import { AiTutor } from './components/AiTutor';
import { NodeComponent } from './components/NodeComponent';
import { ClusterHud } from './components/ClusterHud';

// Utility for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const BROKER_IDS = [101, 102, 103]; // Simulated broker IDs

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
    clusterMode: 'ZOOKEEPER'
  });

  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // --- Helpers ---

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
                const assignedConsumerIdx = i % consumerCount; // The key Kafka logic: Partitions > Consumers -> some get multiple. Consumers > Partitions -> some get none.
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

  // --- Game Loop ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (gameState.isRunning && gameState.gameStatus !== 'GAME_OVER') {
      intervalId = setInterval(() => {
        setGameState(prev => {
            // If any node is rebalancing, the system pauses processing (Stop-the-world rebalance simulation)
            const isSystemRebalancing = prev.nodes.some(n => n.isRebalancing);
            if (isSystemRebalancing) {
                return prev;
            }

            let processedTick = 0;
            
            const nodeUpdates = prev.nodes.map(node => {
                const newNode = { ...node };

                if (node.type === NodeType.TOPIC) {
                    // 1. Inflow
                    const producers = prev.nodes.filter(n => 
                        n.type === NodeType.PRODUCER && 
                        prev.connections.some(c => c.sourceId === n.id && c.targetId === node.id)
                    );
                    const inflow = producers.reduce((sum, p) => sum + (p.productionRate || 0), 0);

                    // 2. Outflow (Processing)
                    // Only Consumers with assigned partitions can process!
                    const connectedConsumers = prev.nodes.filter(n => 
                        n.type === NodeType.CONSUMER && 
                        prev.connections.some(c => c.sourceId === node.id && c.targetId === n.id)
                    );
                    
                    // Sum up capacity of active consumers
                    // Note: In real Kafka, throughput is limited by partition count. 
                    // If we have 1 partition and 10 consumers, only 1 consumer works.
                    // This logic is handled by `assignedPartitions`. If `assignedPartitions` is empty, rate is effective 0.
                    
                    let totalProcessingCapacity = 0;
                    connectedConsumers.forEach(c => {
                        if (c.assignedPartitions && c.assignedPartitions.length > 0) {
                            // Simple model: Consumer processes at full rate if it has ANY partition.
                            // Advanced model: Rate splits if handling multiple? Let's keep it simple: 1 Consumer = 1 Unit of work.
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
            const topics = nodeUpdates.filter(n => n.type === NodeType.TOPIC);
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
  }, [gameState.isRunning, gameState.gameStatus]);


  // --- Actions ---

  const addNode = (type: NodeType) => {
    const count = gameState.nodes.length;
    let defaultX = 100;
    if (type === NodeType.TOPIC) defaultX = 400;
    if (type === NodeType.CONSUMER) defaultX = 700;

    // Pick a random broker for the new topic
    const randomBrokerId = BROKER_IDS[Math.floor(Math.random() * BROKER_IDS.length)];

    const newNode: NodeEntity = {
      id: generateId(),
      type,
      name: `${type === NodeType.TOPIC ? 'Topic' : type === NodeType.CONSUMER ? 'Consumer' : 'Producer'} ${count + 1}`,
      x: defaultX + (Math.random() * 50),
      y: 100 + (count * 50) % 400,
      productionRate: type === NodeType.PRODUCER ? 8 : 0,
      processingRate: type === NodeType.CONSUMER ? 5 : 0,
      currentLag: 0,
      partitions: type === NodeType.TOPIC ? 1 : undefined,
      brokerId: type === NodeType.TOPIC ? randomBrokerId : undefined,
      assignedPartitions: [],
      isRebalancing: false,
      isIdle: type === NodeType.CONSUMER,
      // Default to "CG-1" (Consumer Group 1) for simplicity in this demo
      groupId: type === NodeType.CONSUMER ? 'CG-1' : undefined 
    };

    setGameState(prev => {
        const nextNodesRaw = [...prev.nodes, newNode];
        const nextConnections = [...prev.connections];

        // Auto-connect logic (Simplified for gameplay)
        if (type === NodeType.TOPIC) {
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

        // Apply Rebalance because topology changed
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
          // 1. Remove Node
          const remainingNodes = prev.nodes.filter(n => n.id !== id);
          
          // 2. Remove associated connections
          const remainingConnections = prev.connections.filter(c => c.sourceId !== id && c.targetId !== id);

          // 3. Trigger Rebalance (Important if a Consumer was deleted!)
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
        let newNodes = prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
        
        // If partition count changed, we MUST rebalance
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
      clusterMode: prev.clusterMode
    }));
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
          clusterMode: prev.clusterMode === 'ZOOKEEPER' ? 'KRAFT' : 'ZOOKEEPER'
      }));
  };

  // --- Drag and Drop Handlers ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
      // Prevent dragging if game over
      if (gameState.gameStatus === 'GAME_OVER') return;
      
      const node = gameState.nodes.find(n => n.id === id);
      if (node) {
          setDraggingId(id);
          // Calculate offset so node doesn't jump to mouse position (top-left)
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

  const renderConnections = () => {
    return gameState.connections.map(conn => {
        const source = gameState.nodes.find(n => n.id === conn.sourceId);
        const target = gameState.nodes.find(n => n.id === conn.targetId);
        if (!source || !target) return null;

        const x1 = source.x + 64; // w-32 is 128px, center 64
        const y1 = source.y + 64;
        const x2 = target.x + 64;
        const y2 = target.y + 64;

        return (
            <g key={conn.id}>
                <line 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#52525b" 
                    strokeWidth="2" 
                />
                {gameState.isRunning && !source.isRebalancing && !target.isRebalancing && (
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
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderConnections()}
        </svg>

        {gameState.nodes.map(node => (
            <NodeComponent 
                key={node.id} 
                node={node} 
                onClick={(id) => console.log('clicked', id)} 
                onUpdate={updateNode}
                onDelete={deleteNode}
                onMouseDown={handleMouseDown}
            />
        ))}

        {gameState.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-40 mt-32">
                    <h1 className="text-4xl font-bold mb-2">Start Your Cluster</h1>
                    <p>Use the toolbox to add your first Producer.</p>
                </div>
            </div>
        )}
      </div>

      <AiTutor gameState={gameState} />
    </div>
  );
};

export default App;
