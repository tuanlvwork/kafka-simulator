
import React from 'react';
import { NodeEntity, NodeType } from '../types';
import { Database, Server, User, Loader2, AlertCircle, HardDrive, X, Users, ChevronUp, ChevronDown } from 'lucide-react';

interface NodeComponentProps {
  node: NodeEntity;
  onClick: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<NodeEntity>) => void;
  onDelete?: (id: string) => void;
  onMouseDown?: (e: React.MouseEvent, id: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, onClick, onUpdate, onDelete, onMouseDown }) => {
  const getIcon = () => {
    switch (node.type) {
      case NodeType.PRODUCER:
        return <Server className="w-6 h-6 text-blue-400" />;
      case NodeType.TOPIC:
        return <Database className="w-6 h-6 text-kafka-orange" />;
      case NodeType.CONSUMER:
        return <User className={`w-6 h-6 ${node.isIdle ? 'text-gray-500' : 'text-green-400'}`} />;
    }
  };

  // Visual feedback for Lag (only relevant for Topics)
  const isDanger = node.type === NodeType.TOPIC && (node.currentLag || 0) > 80;
  const isWarning = node.type === NodeType.TOPIC && (node.currentLag || 0) > 50;

  let borderColor = "border-gray-600";
  if (node.isRebalancing) borderColor = "border-yellow-400 border-dashed animate-pulse";
  else if (isDanger) borderColor = "border-red-500 animate-pulse";
  else if (isWarning) borderColor = "border-yellow-500";

  const handlePartitionChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (onUpdate && node.partitions !== undefined) {
      const newCount = Math.max(1, Math.min(6, node.partitions + delta)); // Limit between 1 and 6 for UI
      onUpdate(node.id, { partitions: newCount });
    }
  };

  const handleRateChange = (e: React.MouseEvent, type: 'production' | 'processing', delta: number) => {
    e.stopPropagation();
    if (!onUpdate) return;

    if (type === 'production' && node.productionRate !== undefined) {
      // Range: 1 to 50 msg/s
      const newRate = Math.max(1, Math.min(50, node.productionRate + delta));
      onUpdate(node.id, { productionRate: newRate });
    }
    
    if (type === 'processing' && node.processingRate !== undefined) {
      // Range: 1 to 50 msg/s
      const newRate = Math.max(1, Math.min(50, node.processingRate + delta));
      onUpdate(node.id, { processingRate: newRate });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(node.id);
    }
  }

  return (
    <div
      onMouseDown={(e) => onMouseDown && onMouseDown(e, node.id)}
      onClick={() => onClick(node.id)}
      className={`absolute flex flex-col items-center justify-center w-36 h-36 bg-kafka-gray rounded-xl border-2 ${borderColor} shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none z-10 group`}
      style={{ left: node.x, top: node.y }}
    >
      {/* Delete Button (Visible on Hover) */}
      <button 
        onClick={handleDelete}
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
        className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-white border border-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-30"
        title="Delete Node"
      >
        <X size={12} />
      </button>

      {/* Rebalancing Overlay */}
      {node.isRebalancing && (
        <div className="absolute inset-0 bg-black/60 z-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center text-yellow-400">
            <Loader2 className="animate-spin mb-1" size={20} />
            <span className="text-[10px] font-mono">REBALANCING</span>
          </div>
        </div>
      )}

      {/* Broker Tag for Topics */}
      {node.type === NodeType.TOPIC && node.brokerId && (
        <div className="absolute -top-3 bg-gray-800 text-gray-400 text-[9px] px-2 py-0.5 rounded-full border border-gray-600 flex items-center gap-1">
            <HardDrive size={10} />
            Broker {node.brokerId}
        </div>
      )}

      {/* Consumer Group Tag */}
      {node.type === NodeType.CONSUMER && node.groupId && (
        <div className="absolute -top-3 bg-indigo-900/90 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full border border-indigo-500 flex items-center gap-1 group/cg cursor-help z-40">
            <Users size={10} />
            {node.groupId}
            
            {/* Tooltip for Consumer Group */}
            <div className="absolute bottom-full mb-2 w-48 bg-gray-900 text-gray-300 text-[10px] p-2 rounded border border-gray-700 opacity-0 group-hover/cg:opacity-100 pointer-events-none transition-opacity left-1/2 -translate-x-1/2 text-center shadow-xl">
               Consumers in the same group share the workload (Partitions) of a Topic.
            </div>
        </div>
      )}

      {/* Main Icon */}
      <div className="mb-2 relative">
        {getIcon()}
        {node.isIdle && !node.isRebalancing && (
          <div className="absolute -top-1 -right-1">
             <AlertCircle size={12} className="text-gray-400" fill="black" />
          </div>
        )}
      </div>

      <span className="text-xs font-mono font-bold text-gray-300 pointer-events-none text-center px-1 truncate w-full">{node.name}</span>

      {/* --- TOPIC SPECIFIC UI --- */}
      {node.type === NodeType.TOPIC && (
        <div className="w-full px-2 mt-2 flex flex-col items-center" onMouseDown={(e) => e.stopPropagation()}>
          {/* Partition Bar Visualization */}
          <div className="flex gap-0.5 w-full h-2 mb-1">
             {Array.from({ length: node.partitions || 1 }).map((_, idx) => (
               <div key={idx} className="flex-1 bg-gray-800 rounded-sm overflow-hidden relative">
                  {/* Fill level for this partition */}
                  <div 
                    className={`absolute bottom-0 w-full transition-all duration-300 ${isDanger ? 'bg-red-500' : 'bg-kafka-orange'}`}
                    style={{ height: `${Math.min(node.currentLag || 0, 100)}%` }}
                  />
               </div>
             ))}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2 mt-1">
            <button 
                onClick={(e) => handlePartitionChange(e, -1)}
                className="w-4 h-4 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px]"
            >-</button>
            <span className="text-[9px] text-gray-400 font-mono">Partitions: {node.partitions}</span>
            <button 
                onClick={(e) => handlePartitionChange(e, 1)}
                className="w-4 h-4 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px]"
            >+</button>
          </div>
        </div>
      )}

      {/* --- PRODUCER SPECIFIC UI --- */}
      {node.type === NodeType.PRODUCER && (
        <div className="flex items-center gap-1 mt-2 bg-gray-800/80 rounded border border-gray-700 px-1" onMouseDown={(e) => e.stopPropagation()}>
           <button onClick={(e) => handleRateChange(e, 'production', -1)} className="text-gray-400 hover:text-white px-1.5 hover:bg-gray-700 rounded">-</button>
           <div className="flex flex-col items-center w-10">
               <span className="text-[10px] text-blue-300 font-mono font-bold">{node.productionRate}</span>
               <span className="text-[7px] text-gray-500 uppercase">msg/s</span>
           </div>
           <button onClick={(e) => handleRateChange(e, 'production', 1)} className="text-gray-400 hover:text-white px-1.5 hover:bg-gray-700 rounded">+</button>
        </div>
      )}

      {/* --- CONSUMER SPECIFIC UI --- */}
      {node.type === NodeType.CONSUMER && (
        <div className="flex flex-col items-center mt-1 w-full px-1">
          {/* Processing Rate Control */}
          <div className="flex items-center gap-1 mb-1 bg-gray-800/80 rounded border border-gray-700 px-1" onMouseDown={(e) => e.stopPropagation()}>
             <button onClick={(e) => handleRateChange(e, 'processing', -1)} className="text-gray-400 hover:text-white px-1.5 hover:bg-gray-700 rounded">-</button>
             <div className="flex flex-col items-center w-10">
               <span className="text-[10px] text-green-300 font-mono font-bold">{node.processingRate}</span>
               <span className="text-[7px] text-gray-500 uppercase">msg/s</span>
             </div>
             <button onClick={(e) => handleRateChange(e, 'processing', 1)} className="text-gray-400 hover:text-white px-1.5 hover:bg-gray-700 rounded">+</button>
          </div>

          {node.isIdle ? (
             <span className="text-[9px] text-gray-500 bg-gray-800 px-1 rounded">IDLE (No Partitions)</span>
          ) : (
            <div className="flex flex-wrap justify-center gap-0.5 max-w-full">
              {node.assignedPartitions?.map(p => (
                <span key={p} className="text-[9px] font-mono bg-green-900 text-green-300 px-1 rounded border border-green-700">
                  P{p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
