
import React, { memo } from 'react';
import { NodeType, ClusterMode, Language } from '../types';
import { translations } from '../translations';
import { Plus, Play, Pause, Trash2, ToggleLeft, ToggleRight, RotateCcw, HelpCircle, Globe } from 'lucide-react';

interface ControlPanelProps {
  onAddNode: (type: NodeType) => void;
  onReset: () => void;
  onRetry: () => void;
  onTogglePause: () => void;
  onToggleClusterMode: () => void;
  onShowComponentInfo: (type: NodeType) => void;
  onToggleLanguage: () => void;
  isRunning: boolean;
  gameStatus: string;
  clusterMode: ClusterMode;
  lang: Language;
}

const ControlPanelInternal: React.FC<ControlPanelProps> = ({ 
  onAddNode, 
  onReset, 
  onRetry,
  onTogglePause, 
  onToggleClusterMode,
  onShowComponentInfo,
  onToggleLanguage,
  isRunning,
  gameStatus,
  clusterMode,
  lang
}) => {
  const t = translations[lang].control;
  const appT = translations[lang].app;

  const renderToolButton = (type: NodeType, label: string, subLabel: string, colorClass: string, bgClass: string) => (
    <div className="flex gap-2">
        <button
          onClick={() => onAddNode(type)}
          disabled={gameStatus === 'GAME_OVER'}
          className="flex-1 flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`w-8 h-8 rounded ${bgClass} ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Plus size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-200">{label}</span>
            <span className="text-[10px] text-gray-500">{subLabel}</span>
          </div>
        </button>
        
        <button 
            onClick={() => onShowComponentInfo(type)}
            className="w-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
            title={`${t.whatIs} ${label}?`}
        >
            <HelpCircle size={18} />
        </button>
    </div>
  );

  return (
    <div className="w-64 bg-kafka-dark border-r border-gray-800 p-4 flex flex-col gap-6 relative z-10 h-full overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-1">
            <h2 className="text-kafka-orange font-bold text-xl tracking-tight">StreamWeaver</h2>
            <button 
                onClick={onToggleLanguage}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 border border-gray-600 rounded px-2 py-0.5 hover:text-white hover:border-gray-400 transition-colors"
            >
                <Globe size={10} />
                {lang === 'en' ? 'EN' : 'VN'}
            </button>
        </div>
        <p className="text-xs text-gray-500">{appT.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t.arch}</h3>
        
        <button 
          onClick={onToggleClusterMode}
          className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          <div className="flex flex-col items-start">
             <span className={`text-xs font-bold ${clusterMode === 'ZOOKEEPER' ? 'text-blue-400' : 'text-purple-400'}`}>
                {clusterMode === 'ZOOKEEPER' ? t.zkMode : t.kraftMode}
             </span>
             <span className="text-[9px] text-gray-500">
                {clusterMode === 'ZOOKEEPER' ? t.legacyMeta : t.quorum}
             </span>
          </div>
          {clusterMode === 'ZOOKEEPER' 
            ? <ToggleLeft className="text-gray-500" size={24}/> 
            : <ToggleRight className="text-purple-500" size={24}/>
          }
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t.toolbox}</h3>
        
        {renderToolButton(NodeType.PRODUCER, t.producer, t.producerDesc, 'text-blue-400', 'bg-blue-500/20')}
        {renderToolButton(NodeType.TOPIC, t.topic, t.topicDesc, 'text-kafka-orange', 'bg-kafka-orange/20')}
        {renderToolButton(NodeType.CONSUMER, t.consumer, t.consumerDesc, 'text-green-400', 'bg-green-500/20')}
      </div>

      <div className="mt-auto border-t border-gray-800 pt-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">{t.controls}</h3>
        
        <button
          onClick={onTogglePause}
          disabled={gameStatus === 'GAME_OVER'}
          className={`flex items-center justify-center gap-2 p-2 rounded font-bold transition-colors ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRunning ? <><Pause size={16} /> {t.pause}</> : <><Play size={16} /> {t.start}</>}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 p-2 rounded bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-700 transition-colors"
        >
          <Trash2 size={16} /> {t.reset}
        </button>
      </div>

      {gameStatus === 'GAME_OVER' && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-center animate-in fade-in zoom-in duration-300">
          <p className="text-red-400 font-bold mb-1">{t.crash}</p>
          <p className="text-xs text-red-300 mb-3">{t.crashDesc}</p>
          
          <button 
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 bg-white text-red-600 hover:bg-gray-200 font-bold py-1.5 px-3 rounded text-sm transition-colors"
          >
            <RotateCcw size={14} /> {t.retry}
          </button>
        </div>
      )}
    </div>
  );
};

export const ControlPanel = memo(ControlPanelInternal);
