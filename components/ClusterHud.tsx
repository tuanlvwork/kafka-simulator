
import React from 'react';
import { ClusterMode } from '../types';
import { Server, Database, Boxes, CircuitBoard } from 'lucide-react';

interface ClusterHudProps {
  mode: ClusterMode;
  topicCount: number;
}

// Mock active brokers for visualization
const BROKERS = [101, 102, 103];

export const ClusterHud: React.FC<ClusterHudProps> = ({ mode, topicCount }) => {
  return (
    <div className="absolute top-4 left-4 z-0 pointer-events-none select-none">
      <div className="flex gap-6 items-start">
        
        {/* CONTROLLER SECTION */}
        <div className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500 bg-black/60 backdrop-blur-sm ${mode === 'ZOOKEEPER' ? 'border-blue-500/50' : 'border-purple-500/50'}`}>
          <div className="mb-2">
            {mode === 'ZOOKEEPER' ? (
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-500">
                <Database className="text-blue-400" size={24} />
              </div>
            ) : (
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500 relative">
                <CircuitBoard className="text-purple-400" size={24} />
                <div className="absolute -top-1 -right-1 bg-purple-500 text-[8px] text-black font-bold px-1 rounded">RAFT</div>
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className={`text-xs font-bold ${mode === 'ZOOKEEPER' ? 'text-blue-400' : 'text-purple-400'}`}>
              {mode === 'ZOOKEEPER' ? 'Zookeeper Ensemble' : 'KRaft Controller'}
            </h3>
            <p className="text-[9px] text-gray-500 max-w-[120px] leading-tight mt-1">
              {mode === 'ZOOKEEPER' 
                ? 'External Metadata Management & Leader Election' 
                : 'Internal Metadata Quorum (No Zookeeper required)'}
            </p>
          </div>
          
          {/* Connection Line to Brokers */}
          <div className="h-4 w-0.5 bg-gray-700 mt-2 mb-1"></div>
          <div className="text-[9px] text-gray-600">MANAGES</div>
        </div>

        {/* BROKERS SECTION */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Brokers</h3>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">v3.6.0</span>
           </div>
           
           <div className="flex gap-3">
              {BROKERS.map(id => (
                <div key={id} className="relative group">
                  <div className="w-24 h-24 bg-gray-900/80 border border-gray-700 rounded-lg flex flex-col items-center justify-between p-2">
                      <div className="flex items-center justify-between w-full">
                         <span className="text-[10px] text-gray-500 font-mono">ID:{id}</span>
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                      
                      <Server size={32} className="text-gray-700" />
                      
                      {/* Visualizing "Topics" residing here purely for flavor, actual logic is in game loop */}
                      <div className="w-full flex gap-0.5 mt-1 h-1.5">
                         {Array.from({ length: Math.ceil(topicCount / 3) }).map((_, i) => (
                            <div key={i} className="flex-1 bg-kafka-orange rounded-full opacity-60"></div>
                         ))}
                      </div>
                  </div>
                  
                  {/* Label for KRaft mode inside broker */}
                  {mode === 'KRAFT' && id === 101 && (
                     <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-purple-900/80 border border-purple-500/50 px-1 rounded flex items-center gap-1">
                        <CircuitBoard size={8} className="text-purple-300"/>
                        <span className="text-[8px] text-purple-200">Controller</span>
                     </div>
                  )}
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};
