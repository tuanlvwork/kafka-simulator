
import React from 'react';
import { NodeType, ClusterMode } from '../types';
import { Plus, Play, Pause, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ControlPanelProps {
  onAddNode: (type: NodeType) => void;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleClusterMode: () => void;
  isRunning: boolean;
  gameStatus: string;
  clusterMode: ClusterMode;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onAddNode, 
  onReset, 
  onTogglePause, 
  onToggleClusterMode,
  isRunning,
  gameStatus,
  clusterMode
}) => {
  return (
    <div className="w-64 bg-kafka-dark border-r border-gray-800 p-4 flex flex-col gap-6 relative z-10">
      <div>
        <h2 className="text-kafka-orange font-bold text-xl mb-1 tracking-tight">StreamWeaver</h2>
        <p className="text-xs text-gray-500">Kafka Simulation Engine</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Architecture</h3>
        
        <button 
          onClick={onToggleClusterMode}
          className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          <div className="flex flex-col items-start">
             <span className={`text-xs font-bold ${clusterMode === 'ZOOKEEPER' ? 'text-blue-400' : 'text-purple-400'}`}>
                {clusterMode === 'ZOOKEEPER' ? 'Zookeeper Mode' : 'KRaft Mode'}
             </span>
             <span className="text-[9px] text-gray-500">
                {clusterMode === 'ZOOKEEPER' ? 'Legacy Metadata' : 'Quorum Controller'}
             </span>
          </div>
          {clusterMode === 'ZOOKEEPER' 
            ? <ToggleLeft className="text-gray-500" size={24}/> 
            : <ToggleRight className="text-purple-500" size={24}/>
          }
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Toolbox</h3>
        
        <button
          onClick={() => onAddNode(NodeType.PRODUCER)}
          className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all text-sm group"
        >
          <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-200">Producer</span>
            <span className="text-[10px] text-gray-500">Generates Data</span>
          </div>
        </button>

        <button
          onClick={() => onAddNode(NodeType.TOPIC)}
          className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all text-sm group"
        >
          <div className="w-8 h-8 rounded bg-kafka-orange/20 text-kafka-orange flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-200">Topic</span>
            <span className="text-[10px] text-gray-500">Stores Data</span>
          </div>
        </button>

        <button
          onClick={() => onAddNode(NodeType.CONSUMER)}
          className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all text-sm group"
        >
          <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-200">Consumer</span>
            <span className="text-[10px] text-gray-500">Processes Data</span>
          </div>
        </button>
      </div>

      <div className="mt-auto border-t border-gray-800 pt-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Controls</h3>
        
        <button
          onClick={onTogglePause}
          className={`flex items-center justify-center gap-2 p-2 rounded font-bold transition-colors ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
        >
          {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 p-2 rounded bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-700 transition-colors"
        >
          <Trash2 size={16} /> Reset Board
        </button>
      </div>

      {gameStatus === 'GAME_OVER' && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-center">
          <p className="text-red-400 font-bold mb-1">SYSTEM CRASH</p>
          <p className="text-xs text-red-300">Lag exceeded 100%.</p>
        </div>
      )}
    </div>
  );
};
