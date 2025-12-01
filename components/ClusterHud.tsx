

import React, { useState, useEffect, useRef } from 'react';
import { ClusterMode, ZkLogEntry, MetadataRecord } from '../types';
import { Server, Database, CircuitBoard, Power, AlertTriangle, HelpCircle, Crown, FileText, Folder, GripHorizontal, List, Activity } from 'lucide-react';

interface ClusterHudProps {
  mode: ClusterMode;
  topicCount: number;
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

export const ClusterHud: React.FC<ClusterHudProps> = ({ 
  mode, 
  topicCount,
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
  const isMetadataHealthy = mode === 'KRAFT' ? (activeControllerId !== null) : !isZookeeperOffline;
  const [showExplorer, setShowExplorer] = useState(true);

  // --- Draggable Logic for Explorer ---
  const [explorerPos, setExplorerPos] = useState({ x: 20, y: 240 });
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

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      
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
                    
                    <div className="text-center">
                        <h3 className={`text-xs font-bold ${!isMetadataHealthy ? 'text-red-500' : 'text-blue-400'}`}>
                             ZooKeeper
                        </h3>
                        <p className="text-[9px] text-gray-500 leading-tight mt-1">
                            {isZookeeperOffline 
                                ? <span className="text-red-400 font-bold">CONNECTION LOST</span> 
                                : 'Cluster Metadata'}
                        </p>
                    </div>
                    
                    <div className={`h-4 w-0.5 mt-2 mb-1 transition-colors ${isMetadataHealthy ? 'bg-gray-700' : 'bg-red-900'}`}></div>
                    <div className={`text-[9px] font-bold ${isMetadataHealthy ? 'text-gray-600' : 'text-red-700'}`}>
                        {isMetadataHealthy ? 'MANAGES' : 'DISCONNECTED'}
                    </div>
                </div>
            )}

            {/* KRAFT PLACEHOLDER (To keep layout alignment if ZK is hidden) */}
            {mode === 'KRAFT' && (
                <div className="relative w-40 flex flex-col items-center justify-center pointer-events-auto">
                     <button
                        onClick={onShowInfo}
                        className="bg-gray-800 hover:bg-white text-gray-300 hover:text-black px-3 py-2 rounded-full border border-gray-600 flex items-center gap-2 shadow-lg transition-colors mb-4"
                    >
                        <HelpCircle size={16} />
                        <span className="text-xs font-bold">KRaft Architecture</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 max-w-[120px]">
                            Metadata is distributed across brokers using the Raft consensus protocol.
                        </p>
                    </div>
                </div>
            )}

            {/* BROKERS SECTION */}
            <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Brokers</h3>
                    {mode === 'KRAFT' && <span className="text-[9px] bg-purple-900 text-purple-200 px-1 rounded border border-purple-500">Dual Role: Data + Controller</span>}
                </div>
                
                <div className="flex gap-3">
                    {BROKERS.map(id => {
                        const isOnline = brokerStates[id];
                        const isController = id === activeControllerId;
                        
                        // In KRaft, all nodes shown are likely voters in a small cluster
                        const isVoter = mode === 'KRAFT' && isOnline;

                        return (
                        <div key={id} className="relative group w-24">
                            {/* Controller Crown */}
                            {isController && isOnline && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce z-30 drop-shadow-lg flex flex-col items-center">
                                    <Crown size={20} fill="currentColor" />
                                    <span className="text-[8px] font-bold bg-yellow-500/10 text-yellow-200 px-1 rounded border border-yellow-500/50 backdrop-blur-sm whitespace-nowrap">CONTROLLER</span>
                                </div>
                            )}

                            {/* Broker Box */}
                            <div className={`w-24 h-24 border rounded-lg flex flex-col items-center justify-between p-2 z-10 relative shadow-xl transition-all duration-300 ${isOnline ? (isController ? 'bg-gray-900 border-yellow-500/50 shadow-yellow-900/20' : 'bg-gray-900/90 border-gray-700') : 'bg-red-950/90 border-red-600'}`}>
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-[10px] font-mono ${isOnline ? 'text-gray-500' : 'text-red-400 font-bold'}`}>ID:{id}</span>
                                    <button 
                                        onClick={() => onToggleBroker(id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isOnline ? 'text-green-500 hover:bg-red-900/50 hover:text-red-500' : 'text-red-500 hover:text-green-400'}`}
                                        title={isOnline ? "Crash Broker" : "Restart Broker"}
                                    >
                                        <Power size={12} />
                                    </button>
                                </div>
                                
                                {isOnline ? (
                                    mode === 'KRAFT' ? 
                                    <CircuitBoard size={32} className={isController ? "text-purple-300" : "text-purple-800"} /> :
                                    <Server size={32} className={isController ? "text-yellow-100" : "text-gray-700"} />
                                ) : (
                                    <AlertTriangle size={32} className="text-red-500 animate-pulse" />
                                )}
                                
                                {isVoter && (
                                    <div className="absolute bottom-1 w-full text-center">
                                        <span className="text-[8px] uppercase font-bold text-gray-500">Raft Voter</span>
                                    </div>
                                )}

                                {/* Status Label */}
                                {!isOnline && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-bold text-red-500 text-xs rotate-12 pointer-events-none">
                                        OFFLINE
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
            className={`absolute w-72 bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-in fade-in zoom-in duration-300 ${isDragging ? 'cursor-grabbing border-blue-500/50 shadow-blue-900/20' : ''}`}
          >
              <div 
                onMouseDown={handleMouseDown}
                className="bg-gray-900/90 p-2 border-b border-gray-700 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-gray-800 transition-colors"
              >
                  <div className="flex items-center gap-2">
                      {mode === 'ZOOKEEPER' ? <Database size={14} className="text-blue-400" /> : <List size={14} className="text-purple-400" />}
                      <span className={`text-xs font-bold ${mode === 'ZOOKEEPER' ? 'text-blue-100' : 'text-purple-100'}`}>
                          {mode === 'ZOOKEEPER' ? 'ZNode Explorer' : 'Metadata Log (@metadata)'}
                      </span>
                  </div>
                  <div className="flex gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <GripHorizontal size={14} className="text-gray-600" />
                  </div>
              </div>
              
              {mode === 'ZOOKEEPER' ? (
                  /* --- ZOOKEEPER TREE VIEW --- */
                  <div className="flex-1 p-2 font-mono text-[10px] text-gray-400 overflow-y-auto max-h-[150px] bg-black/20">
                    <div className="mb-2">
                        <div className="flex items-center gap-1 text-gray-300">
                            <Folder size={10} fill="currentColor" className="text-blue-500/50" />
                            <span>/brokers/ids</span>
                        </div>
                        <div className="pl-4 flex flex-col gap-0.5 mt-0.5">
                            {BROKERS.map(id => brokerStates[id] && (
                                <div key={id} className="flex items-center gap-1 text-green-400 animate-in fade-in duration-300">
                                    <FileText size={8} />
                                    <span>{id}</span>
                                    <span className="text-[8px] text-gray-600 ml-auto">ephemeral</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-2">
                        <div className="flex items-center gap-1 text-gray-300">
                            <Folder size={10} fill="currentColor" className="text-blue-500/50" />
                            <span>/config/topics</span>
                        </div>
                        <div className="pl-4 mt-0.5">
                            {topicCount === 0 ? <span className="text-gray-600 italic">empty</span> : (
                                <div className="text-blue-300">{topicCount} topics registered</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 text-gray-300">
                            <Folder size={10} fill="currentColor" className="text-blue-500/50" />
                            <span>/controller</span>
                        </div>
                        <div className="pl-4 mt-0.5 text-yellow-500">
                            {activeControllerId ? `{"brokerid":${activeControllerId}}` : "null"}
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
                                <div className="text-gray-600 italic text-center mt-10">Waiting for events...</div>
                            )}
                            {raftLogs.map((log) => (
                                <div key={log.offset} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-gray-600 w-6 text-right">{log.offset}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${log.type === 'BROKER_CHANGE' ? 'text-green-400' : 'text-blue-400'}`}>{log.type}</span>
                                            <span className="text-gray-500">t={log.timestamp}</span>
                                        </div>
                                        <div className="text-gray-300 break-all">{log.key}:{log.value}</div>
                                    </div>
                                </div>
                            ))}
                       </div>
                       <div className="p-1 bg-gray-900 text-[9px] text-gray-500 text-center border-t border-gray-800">
                           Replicated via Raft Protocol
                       </div>
                   </div>
              )}

              {/* ZK Only Logs Footer */}
              {mode === 'ZOOKEEPER' && (
                <div className="h-24 border-t border-gray-700 bg-black text-[9px] font-mono p-2 overflow-y-auto" ref={logsRef}>
                    <div className="text-gray-500 mb-1 sticky top-0 bg-black font-bold border-b border-gray-800">TRANSACTION LOGS</div>
                    {zkLogs.length === 0 && <span className="text-gray-700 italic">No activity...</span>}
                    {zkLogs.map(log => (
                        <div key={log.id} className="mb-0.5 flex gap-1 animate-in fade-in slide-in-from-right-2">
                            <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={
                                log.action === 'ELECT' ? 'text-yellow-400' : 
                                log.action === 'REGISTER' ? 'text-green-400' :
                                log.action === 'DELETE' ? 'text-red-400' : 'text-blue-400'
                            }>{log.action}</span>
                            <span className="text-gray-400">{log.path}</span>
                        </div>
                    ))}
                </div>
              )}
          </div>
      )}

    </div>
  );
};
