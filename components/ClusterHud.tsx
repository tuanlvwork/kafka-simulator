
import React, { useState, useEffect, useRef, memo } from 'react';
import { ClusterMode, ZkLogEntry, MetadataRecord, Language, NodeEntity, NodeType } from '../types';
import { translations } from '../translations';
import { Server, Database, CircuitBoard, Power, AlertTriangle, HelpCircle, Crown, FileText, Folder, GripHorizontal, List, Activity, HardDrive, Network } from 'lucide-react';

interface ClusterHudProps {
  mode: ClusterMode;
  lang: Language;
  nodes: NodeEntity[]; // Received all nodes to calculate storage
  brokerStates: Record<number, boolean>; // true = online, false = offline
  isZookeeperOffline: boolean;
  activeControllerId: number | null;
  zkLogs: ZkLogEntry[];
  raftLogs: MetadataRecord[];
  totalProcessed: number; // For simulating offset updates
  onToggleBroker: (id: number) => void;
  onToggleZookeeper: () => void;
  onShowInfo: () => void;
}

// Mock active brokers for visualization
const BROKERS = [101, 102, 103];

// Coordinates for visual connections (Must match layout)
const ZK_CENTER = { x: 96, y: 90 };
const BROKER_CENTERS: Record<number, {x: number, y: number}> = {
    101: { x: 248, y: 90 },
    102: { x: 356, y: 90 },
    103: { x: 464, y: 90 },
};

const ClusterHudInternal: React.FC<ClusterHudProps> = ({ 
  mode, 
  lang,
  nodes,
  brokerStates, 
  isZookeeperOffline,
  activeControllerId,
  zkLogs,
  raftLogs,
  totalProcessed,
  onToggleBroker,
  onToggleZookeeper,
  onShowInfo
}) => {
  const t = translations[lang].hud;
  const isMetadataHealthy = mode === 'KRAFT' ? (activeControllerId !== null) : !isZookeeperOffline;
  const [showExplorer, setShowExplorer] = useState(true);
  const topicCount = nodes.filter(n => n.type === NodeType.TOPIC).length;

  // --- Draggable Logic for Explorer ---
  const [explorerPos, setExplorerPos] = useState({ x: 20, y: 350 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Calculate offset relative to the modal's top-left corner
    dragOffset.current = {
      x: e.clientX - explorerPos.x,
      y: e.clientY - explorerPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setExplorerPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  // Auto-scroll logs
  const logsRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [zkLogs, raftLogs]);

  // --- Render Architectural Links (SVG) ---
  const renderArchitectureLines = () => {
      return (
          <svg className="absolute top-0 left-0 w-full h-[250px] pointer-events-none z-0">
              <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                  <marker id="arrowhead-purple" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
                  </marker>
              </defs>
              
              {/* Zookeeper Mode: Line from ZK to Controller */}
              {mode === 'ZOOKEEPER' && !isZookeeperOffline && activeControllerId && (
                  <g>
                      <path 
                          d={`M${ZK_CENTER.x},${ZK_CENTER.y} C${ZK_CENTER.x + 50},${ZK_CENTER.y} ${BROKER_CENTERS[activeControllerId].x - 50},${BROKER_CENTERS[activeControllerId].y} ${BROKER_CENTERS[activeControllerId].x},${BROKER_CENTERS[activeControllerId].y}`}
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                          fill="none"
                          markerEnd="url(#arrowhead)"
                          className="animate-pulse"
                          opacity="0.6"
                      />
                      <text x={(ZK_CENTER.x + BROKER_CENTERS[activeControllerId].x)/2} y={ZK_CENTER.y - 10} textAnchor="middle" fill="#60a5fa" fontSize="9" className="font-mono bg-black">
                          Control Plane
                      </text>
                  </g>
              )}

              {/* KRaft Mode: Mesh between Brokers (Quorum) */}
              {mode === 'KRAFT' && (
                  <g>
                      {/* Ring 101-102 */}
                      {brokerStates[101] && brokerStates[102] && (
                           <line x1={BROKER_CENTERS[101].x} y1={BROKER_CENTERS[101].y} x2={BROKER_CENTERS[102].x} y2={BROKER_CENTERS[102].y} stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                      )}
                      {/* Ring 102-103 */}
                      {brokerStates[102] && brokerStates[103] && (
                           <line x1={BROKER_CENTERS[102].x} y1={BROKER_CENTERS[102].y} x2={BROKER_CENTERS[103].x} y2={BROKER_CENTERS[103].y} stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                      )}
                      {/* Ring 103-101 (Curved) */}
                      {brokerStates[103] && brokerStates[101] && (
                           <path d={`M${BROKER_CENTERS[101].x},${BROKER_CENTERS[101].y + 60} Q${(BROKER_CENTERS[101].x + BROKER_CENTERS[103].x)/2},${BROKER_CENTERS[101].y + 100} ${BROKER_CENTERS[103].x},${BROKER_CENTERS[103].y + 60}`} stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" fill="none"/>
                      )}
                      
                      {activeControllerId && (
                           <text x={356} y={150} textAnchor="middle" fill="#d8b4fe" fontSize="9" className="font-mono">
                               Raft Quorum Peer-to-Peer
                           </text>
                      )}
                  </g>
              )}
          </svg>
      );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      
      {/* Visual Connections */}
      {renderArchitectureLines()}

      {/* --- FIXED SECTION: BROKERS & CONTROLLER --- */}
      <div className="absolute top-4 left-4 flex flex-col gap-4">
          <div className="flex gap-6 items-start">
            
            {/* ZOOKEEPER BOX (Only visible in ZK Mode) */}
            {mode === 'ZOOKEEPER' && (
                <div className={`relative w-40 flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500 bg-black/90 backdrop-blur-md pointer-events-auto shadow-2xl ${isMetadataHealthy ? 'border-blue-500/50' : 'border-red-600'}`}>
                    <button
                        onClick={onShowInfo}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 hover:bg-white text-gray-300 hover:text-black rounded-full border border-gray-500 flex items-center justify-center shadow-lg transition-colors z-20"
                        title="Learn about Architecture"
                    >
                        <HelpCircle size={14} strokeWidth={2.5} />
                    </button>

                    <button 
                        onClick={onToggleZookeeper}
                        className={`absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center transition-colors ${!isZookeeperOffline ? 'text-green-500 hover:bg-red-900/50 hover:text-red-500' : 'text-red-500 hover:text-green-400'}`}
                        title={!isZookeeperOffline ? "Kill Zookeeper" : "Start Zookeeper"}
                    >
                        <Power size={14} />
                    </button>

                    <div className="mb-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-colors ${isZookeeperOffline ? 'bg-red-900/30 border-red-500' : 'bg-blue-900/30 border-blue-500'}`}>
                            {isZookeeperOffline ? <AlertTriangle className="text-red-500 animate-pulse" size={24} /> : <Database className="text-blue-400" size={24} />}
                        </div>
                    </div>
                    
                    <div className="text-center w-full">
                        <h3 className={`text-xs font-bold ${!isMetadataHealthy ? 'text-red-500' : 'text-blue-400'}`}>
                             {t.zookeeper}
                        </h3>
                        <p className="text-[9px] text-gray-500 leading-tight mt-1">
                            {isZookeeperOffline 
                                ? <span className="text-red-400 font-bold">{t.connectionLost}</span> 
                                : t.clusterMeta}
                        </p>
                        
                        {!isZookeeperOffline && activeControllerId && (
                            <div className="mt-2 text-[9px] bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 flex items-center justify-center gap-1">
                                <Crown size={8} /> Controller: {activeControllerId}
                            </div>
                        )}
                    </div>
                    
                    <div className={`h-4 w-0.5 mt-2 mb-1 transition-colors ${isMetadataHealthy ? 'bg-gray-700' : 'bg-red-900'}`}></div>
                    <div className={`text-[9px] font-bold ${isMetadataHealthy ? 'text-gray-600' : 'text-red-700'}`}>
                        {isMetadataHealthy ? t.manages : t.disconnected}
                    </div>
                </div>
            )}

            {/* KRAFT PLACEHOLDER (To keep layout alignment if ZK is hidden) */}
            {mode === 'KRAFT' && (
                <div className="relative w-40 flex flex-col items-center justify-center pointer-events-auto h-[140px]">
                     <button
                        onClick={onShowInfo}
                        className="bg-gray-800 hover:bg-white text-gray-300 hover:text-black px-3 py-2 rounded-full border border-gray-600 flex items-center gap-2 shadow-lg transition-colors mb-4 group"
                    >
                        <HelpCircle size={16} className="group-hover:text-purple-600"/>
                        <span className="text-xs font-bold">{t.kraftArch}</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 max-w-[120px] leading-relaxed">
                            {t.kraftDesc}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-purple-400">
                             <Network size={10} /> Quorum Active
                        </div>
                    </div>
                </div>
            )}

            {/* BROKERS SECTION */}
            <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 mb-1 pl-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.brokers}</h3>
                    {mode === 'KRAFT' && <span className="text-[9px] bg-purple-900/50 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/30">{t.dualRole}</span>}
                    
                    {/* Legend */}
                    <div className="ml-auto flex gap-2">
                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                            <span className="w-2 h-2 rounded bg-blue-500"></span> {t.leader}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                            <span className="w-2 h-2 rounded bg-gray-600"></span> {t.replica}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {BROKERS.map(id => {
                        const isOnline = brokerStates[id];
                        const isController = id === activeControllerId;
                        const isVoter = mode === 'KRAFT' && isOnline;

                        // Calculate Hosted Partitions (Storage Visualization)
                        const hostedTopics = nodes.filter(n => 
                            n.type === NodeType.TOPIC && 
                            !n.isOffline && // Only show if topic is generally reachable (simplified)
                            n.replicas?.includes(id)
                        );

                        return (
                        <div key={id} className="relative group w-24">
                            {/* Controller Crown */}
                            {isController && isOnline && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce z-30 drop-shadow-lg flex flex-col items-center">
                                    <Crown size={20} fill="currentColor" />
                                    <span className="text-[8px] font-bold bg-yellow-500/10 text-yellow-200 px-1 rounded border border-yellow-500/50 backdrop-blur-sm whitespace-nowrap shadow-lg">
                                        {t.controller}
                                    </span>
                                </div>
                            )}

                            {/* Broker Box */}
                            <div className={`w-24 min-h-[140px] border rounded-lg flex flex-col p-2 z-10 relative shadow-xl transition-all duration-300 ${isOnline ? (isController ? 'bg-gray-900 border-yellow-500/50 shadow-yellow-900/20' : 'bg-gray-900/90 border-gray-700') : 'bg-red-950/90 border-red-600'}`}>
                                <div className="flex items-center justify-between w-full mb-2 border-b border-gray-800 pb-1">
                                    <span className={`text-[10px] font-mono ${isOnline ? 'text-gray-500' : 'text-red-400 font-bold'}`}>ID:{id}</span>
                                    <button 
                                        onClick={() => onToggleBroker(id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isOnline ? 'text-green-500 hover:bg-red-900/50 hover:text-red-500' : 'text-red-500 hover:text-green-400'}`}
                                        title={isOnline ? "Crash Broker" : "Restart Broker"}
                                    >
                                        <Power size={12} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center">
                                    {isOnline ? (
                                        mode === 'KRAFT' ? 
                                        <CircuitBoard size={24} className={`mb-2 ${isController ? "text-purple-300" : "text-purple-800"}`} /> :
                                        <Server size={24} className={`mb-2 ${isController ? "text-yellow-100" : "text-gray-700"}`} />
                                    ) : (
                                        <AlertTriangle size={24} className="text-red-500 animate-pulse mb-2" />
                                    )}

                                    {/* STORAGE VISUALIZATION */}
                                    {isOnline && (
                                        <div className="w-full mt-1">
                                            <div className="flex items-center gap-1 text-[8px] text-gray-500 mb-1 border-b border-gray-800">
                                                <HardDrive size={8} /> {t.diskStorage}
                                            </div>
                                            <div className="flex flex-col gap-1 w-full max-h-[60px] overflow-y-auto">
                                                {hostedTopics.length === 0 && <span className="text-[8px] text-gray-700 italic text-center py-2">{t.empty}</span>}
                                                {hostedTopics.map(topic => {
                                                    const isLeader = topic.activeLeaderId === id;
                                                    return (
                                                        <div key={topic.id} className={`w-full rounded-[2px] px-1 py-0.5 text-[8px] flex items-center justify-between font-mono truncate border-l-2 ${isLeader ? 'bg-blue-900/20 text-blue-300 border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-500'}`}>
                                                            <span className="truncate max-w-[60px]">{topic.name}</span>
                                                            <span className="text-[7px] font-bold">{isLeader ? "L" : "R"}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {isVoter && (
                                    <div className="absolute bottom-1 w-full text-center">
                                        <span className="text-[7px] uppercase font-bold text-purple-500/70">{t.raftVoter}</span>
                                    </div>
                                )}

                                {/* Status Label */}
                                {!isOnline && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-bold text-red-500 text-xs rotate-12 pointer-events-none">
                                        {t.offline}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
          </div>
      </div>

      {/* --- DRAGGABLE EXPLORER WINDOW --- */}
      {showExplorer && (mode === 'ZOOKEEPER' ? !isZookeeperOffline : true) && (
          <div 
            style={{ left: explorerPos.x, top: explorerPos.y }}
            className={`absolute w-80 bg-black/90 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-in fade-in zoom-in duration-300 ${isDragging ? 'cursor-grabbing border-blue-500/50 shadow-blue-900/20' : ''}`}
          >
              <div 
                onMouseDown={handleMouseDown}
                className="bg-gray-800 p-2 border-b border-gray-700 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-gray-750 transition-colors"
              >
                  <div className="flex items-center gap-2">
                      {mode === 'ZOOKEEPER' ? <Database size={14} className="text-blue-400" /> : <List size={14} className="text-purple-400" />}
                      <span className={`text-xs font-bold ${mode === 'ZOOKEEPER' ? 'text-blue-100' : 'text-purple-100'}`}>
                          {mode === 'ZOOKEEPER' ? t.znodeExplorer : t.metaLog}
                      </span>
                  </div>
                  <div className="flex gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <GripHorizontal size={14} className="text-gray-600" />
                  </div>
              </div>
              
              {mode === 'ZOOKEEPER' ? (
                  /* --- ZOOKEEPER TREE VIEW --- */
                  <div className="flex-1 p-3 font-mono text-[10px] text-gray-400 overflow-y-auto max-h-[180px] bg-black/40">
                    <div className="mb-3">
                        <div className="flex items-center gap-1.5 text-gray-200 font-bold bg-gray-900/50 p-1 rounded">
                            <Folder size={12} fill="currentColor" className="text-blue-500" />
                            <span>/brokers/ids</span>
                        </div>
                        <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-gray-800 ml-2">
                            {BROKERS.map(id => brokerStates[id] && (
                                <div key={id} className="flex items-center gap-1.5 text-green-400 animate-in fade-in duration-300">
                                    <FileText size={10} />
                                    <span>{id}</span>
                                    <span className="text-[8px] text-gray-600 ml-auto bg-gray-900 px-1 rounded">ephemeral</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="flex items-center gap-1.5 text-gray-200 font-bold bg-gray-900/50 p-1 rounded">
                            <Folder size={12} fill="currentColor" className="text-blue-500" />
                            <span>/config/topics</span>
                        </div>
                        <div className="pl-6 mt-1 border-l border-gray-800 ml-2">
                            {topicCount === 0 ? <span className="text-gray-600 italic pl-1">{t.empty}</span> : (
                                <div className="text-blue-300 flex items-center gap-1.5">
                                    <FileText size={10} />
                                    {topicCount} {t.topicsReg}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5 text-gray-200 font-bold bg-gray-900/50 p-1 rounded">
                            <Folder size={12} fill="currentColor" className="text-blue-500" />
                            <span>/controller</span>
                        </div>
                        <div className="pl-6 mt-1 border-l border-gray-800 ml-2">
                            {activeControllerId ? (
                                <div className="text-yellow-500 flex items-center gap-1.5">
                                    <FileText size={10} />
                                    {`{"brokerid":${activeControllerId}}`}
                                </div>
                            ) : <span className="text-red-500 italic">null</span>}
                        </div>
                    </div>
                  </div>
              ) : (
                   /* --- KRAFT LOG VIEW --- */
                   <div className="flex-1 p-0 font-mono text-[10px] bg-black/40 overflow-hidden flex flex-col h-[200px]">
                       <div className="flex items-center gap-2 p-2 bg-purple-900/10 border-b border-purple-500/20">
                            <Activity size={10} className="text-purple-400"/>
                            <span className="text-purple-200">Internal Topic: __cluster_metadata</span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={logsRef}>
                            {raftLogs.length === 0 && (
                                <div className="text-gray-600 italic text-center mt-10">{t.waiting}</div>
                            )}
                            {raftLogs.map((log) => (
                                <div key={log.offset} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 group hover:bg-white/5 p-0.5 rounded">
                                    <span className="text-gray-600 w-8 text-right shrink-0 select-none">@{log.offset}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[9px] px-1 rounded font-bold ${log.type === 'BROKER_CHANGE' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                                                {log.type}
                                            </span>
                                            <span className="text-gray-600 text-[8px]">{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                                        </div>
                                        <div className="text-gray-300 truncate font-mono">
                                            <span className="text-gray-500">{log.key}:</span> {log.value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                       </div>
                       <div className="p-1 bg-gray-900 text-[9px] text-gray-500 text-center border-t border-gray-800 flex items-center justify-center gap-2">
                           <Network size={10} /> {t.replRaft}
                       </div>
                   </div>
              )}

              {/* ZK Only Logs Footer */}
              {mode === 'ZOOKEEPER' && (
                <div className="h-24 border-t border-gray-700 bg-black text-[9px] font-mono p-2 overflow-y-auto" ref={logsRef}>
                    <div className="text-gray-500 mb-1 sticky top-0 bg-black font-bold border-b border-gray-800 flex justify-between">
                        <span>{t.transLogs}</span>
                        <span className="text-xs">Txn ID</span>
                    </div>
                    {zkLogs.length === 0 && <span className="text-gray-700 italic">{t.noActivity}</span>}
                    {zkLogs.map(log => (
                        <div key={log.id} className="mb-0.5 flex gap-2 animate-in fade-in slide-in-from-right-2 hover:bg-white/5 p-0.5 rounded">
                            <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={`font-bold shrink-0 w-16 ${
                                log.action === 'ELECT' ? 'text-yellow-400' : 
                                log.action === 'REGISTER' ? 'text-green-400' :
                                log.action === 'DELETE' ? 'text-red-400' : 'text-blue-400'
                            }`}>{log.action}</span>
                            <span className="text-gray-400 truncate">{log.path}</span>
                        </div>
                    ))}
                </div>
              )}
          </div>
      )}

    </div>
  );
};

// Custom comparison to prevent re-renders when nodes move (x, y changes)
export const ClusterHud = memo(ClusterHudInternal, (prev, next) => {
    // Basic props comparison
    if (prev.mode !== next.mode) return false;
    if (prev.lang !== next.lang) return false;
    if (prev.totalProcessed !== next.totalProcessed) return false;
    if (prev.isZookeeperOffline !== next.isZookeeperOffline) return false;
    if (prev.activeControllerId !== next.activeControllerId) return false;
    if (prev.zkLogs !== next.zkLogs) return false;
    if (prev.raftLogs !== next.raftLogs) return false;
    
    // Deep comparison for broker states (usually small object)
    if (JSON.stringify(prev.brokerStates) !== JSON.stringify(next.brokerStates)) return false;

    // Complex: Check if nodes CHANGED in a way that affects HUD (storage viz). 
    // Moving (x,y) should NOT trigger re-render.
    // Changing Replicas, Leader, or Topic Name SHOULD.
    if (prev.nodes.length !== next.nodes.length) return false;

    // We only care about TOPICS for the HUD storage view
    const prevTopics = prev.nodes.filter(n => n.type === NodeType.TOPIC);
    const nextTopics = next.nodes.filter(n => n.type === NodeType.TOPIC);

    if (prevTopics.length !== nextTopics.length) return false;

    for (let i = 0; i < prevTopics.length; i++) {
        const p = prevTopics[i];
        const n = nextTopics[i];
        
        if (p.id !== n.id) return false;
        if (p.name !== n.name) return false;
        if (p.activeLeaderId !== n.activeLeaderId) return false;
        if (JSON.stringify(p.replicas) !== JSON.stringify(n.replicas)) return false;
        if (p.isOffline !== n.isOffline) return false;
    }

    return true; // Props are equal enough for HUD purposes
});
