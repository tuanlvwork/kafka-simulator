
import React from 'react';
import { X, Database, CircuitBoard, CheckCircle2 } from 'lucide-react';
import { ClusterMode, Language } from '../types';
import { translations } from '../translations';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: ClusterMode;
  lang: Language;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ isOpen, onClose, activeMode, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang].archModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-kafka-dark border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{t.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{t.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Zookeeper Column */}
          <div className={`rounded-xl border p-5 transition-all ${activeMode === 'ZOOKEEPER' ? 'bg-blue-900/10 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-gray-900/30 border-gray-800 opacity-70 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <Database className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-blue-100">{t.zkTitle}</h3>
              {activeMode === 'ZOOKEEPER' && <span className="ml-auto text-[10px] bg-blue-500 text-black font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
            </div>

            <p className="text-sm text-gray-300 mb-4 italic border-l-2 border-blue-500/30 pl-3">
              {t.zkDesc}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 size={14} /> {t.zkFeature1}
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 pl-5 space-y-1">
                  <li>{t.zkFeature1Desc}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> {t.zkFeature2}
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  {t.zkFeature2Desc}
                </p>
              </div>

              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> {t.zkFeature3}
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  {t.zkFeature3Desc}
                </p>
              </div>
            </div>
          </div>

          {/* KRaft Column */}
          <div className={`rounded-xl border p-5 transition-all ${activeMode === 'KRAFT' ? 'bg-purple-900/10 border-purple-500/50 ring-1 ring-purple-500/30' : 'bg-gray-900/30 border-gray-800 opacity-70 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <CircuitBoard className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-purple-100">{t.kraftTitle}</h3>
              {activeMode === 'KRAFT' && <span className="ml-auto text-[10px] bg-purple-500 text-black font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
            </div>

             <p className="text-sm text-gray-300 mb-4 italic border-l-2 border-purple-500/30 pl-3">
              {t.kraftDesc}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 size={14} /> {t.kraftFeature1}
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 pl-5 space-y-1">
                   <li>{t.kraftFeature1Desc}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> {t.kraftFeature2}
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  {t.kraftFeature2Desc}
                </p>
              </div>

              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> {t.kraftFeature3}
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  {t.kraftFeature3Desc}
                </p>
              </div>
            </div>
          </div>

        </div>
        
        {/* Footer Summary */}
        <div className="p-6 bg-gray-900 border-t border-gray-800">
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t.summary}</h4>
             <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 rounded bg-black/40 border border-gray-800">
                    <span className="text-blue-400 font-bold">ZooKeeper:</span> {t.zkSum}
                </div>
                <div className="p-2 rounded bg-black/40 border border-gray-800">
                    <span className="text-purple-400 font-bold">KRaft:</span> {t.kraftSum}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};
