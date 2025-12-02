
import React from 'react';
import { X, Server, Database, User, Layers, ShieldCheck, Cpu, Share2, ListOrdered, ArrowRight, GitMerge, Network } from 'lucide-react';
import { NodeType, Language } from '../types';
import { translations } from '../translations';

interface ComponentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NodeType | null;
  lang: Language;
}

export const ComponentInfoModal: React.FC<ComponentInfoModalProps> = ({ isOpen, onClose, type, lang }) => {
  if (!isOpen || !type) return null;
  const t = translations[lang].compModal;

  const renderContent = () => {
    switch (type) {
      case NodeType.PRODUCER:
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/50">
                <Server className="text-blue-400" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-100">{t.producerTitle}</h2>
                <p className="text-gray-400">{t.producerSub}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {t.producerDesc}
                </p>
              </div>

              {/* MULTI-TOPIC PUBLISHING */}
              <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-800">
                  <h4 className="flex items-center gap-2 text-blue-300 font-bold mb-2">
                    <Network size={16} /> {t.multiPubTitle}
                  </h4>
                  <p className="text-xs text-gray-300 mb-2 font-semibold">
                    {t.multiPubDesc}
                  </p>
                  <p className="text-xs text-gray-400 italic">
                     {t.multiPubPros}
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="flex items-center gap-2 text-blue-300 font-bold mb-2">
                    <Share2 size={16} /> {t.partStrat}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t.partStratDesc}
                  </p>
                  <ul className="list-disc list-inside mt-2 text-xs text-gray-500 space-y-1">
                    <li><span className="text-gray-300">{t.roundRobin}</span></li>
                    <li><span className="text-gray-300">{t.keyBased}</span></li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="flex items-center gap-2 text-blue-300 font-bold mb-2">
                    <ShieldCheck size={16} /> {t.acks}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t.acksDesc}
                  </p>
                  <ul className="list-disc list-inside mt-2 text-xs text-gray-500 space-y-1">
                    <li><span className="text-gray-300">{t.ack0}</span></li>
                    <li><span className="text-gray-300">{t.ack1}</span></li>
                    <li><span className="text-gray-300">{t.ackAll}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        );

      case NodeType.TOPIC:
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/50">
                <Database className="text-kafka-orange" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-orange-100">{t.topicTitle}</h2>
                <p className="text-gray-400">{t.topicSub}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {t.topicDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                    <Layers size={16} /> {t.partitions}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t.partDesc}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                    <ListOrdered size={16} /> {t.offset}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {t.offsetDesc}
                  </p>
                </div>
              </div>
            </div>
          </>
        );

      case NodeType.CONSUMER:
        return (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/50">
                <User className="text-green-400" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-100">{t.consumerTitle}</h2>
                <p className="text-gray-400">{t.consumerSub}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {t.consumerDesc}
                </p>
              </div>

              {/* MULTI-TOPIC SUBSCRIPTION */}
              <div className="p-4 rounded-lg bg-green-900/10 border border-green-800">
                  <h4 className="flex items-center gap-2 text-green-400 font-bold mb-2">
                    <GitMerge size={16} /> {t.multiSubTitle}
                  </h4>
                  <p className="text-xs text-gray-300 mb-2 font-semibold">
                    {t.multiSubDesc}
                  </p>
                  <p className="text-xs text-gray-400 italic mb-2">
                     {t.multiSubPros}
                  </p>
                  <p className="text-xs text-yellow-500 font-bold border-t border-green-800/50 pt-2">
                     {t.multiSubWarn}
                  </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="flex items-center gap-2 text-green-400 font-bold mb-2">
                    <Cpu size={16} /> {t.cg}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    {t.cgDesc}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                     <div className="bg-black/40 p-2 rounded border border-gray-700">
                        {t.lb}
                     </div>
                     <div className="bg-black/40 p-2 rounded border border-gray-700">
                        {t.rebal}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-kafka-dark border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl relative max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 overflow-y-auto">
           {renderContent()}
        </div>

        <div className="px-8 py-4 bg-gray-900 border-t border-gray-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center gap-2"
            >
                {t.gotIt} <ArrowRight size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};
