
import React, { useState, useEffect, memo } from 'react';
import { GameState, Language } from '../types';
import { geminiService } from '../services/geminiService';
import { translations } from '../translations';
import { Sparkles, MessageSquare, Loader2 } from 'lucide-react';

interface AiTutorProps {
  gameState: GameState;
  lang: Language;
}

const AiTutorInternal: React.FC<AiTutorProps> = ({ gameState, lang }) => {
  const t = translations[lang].ai;
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(0);

  // Initialize advice text
  useEffect(() => {
    if (!advice) {
        setAdvice(t.init);
    }
  }, [t.init, advice]);

  // Poll for advice every 10 seconds or when critical state changes
  useEffect(() => {
    const now = Date.now();
    // Throttle requests to avoid rate limits, but force update on Game Over
    if (gameState.gameStatus === 'GAME_OVER' || (now - lastCheck > 10000 && gameState.isRunning)) {
      setLastCheck(now);
      fetchAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.globalLag, gameState.gameStatus, gameState.isRunning, lang]); // Add lang to dep array

  const fetchAdvice = async () => {
    setIsLoading(true);
    const text = await geminiService.analyzeBoard(gameState, lang);
    setAdvice(text);
    setIsLoading(false);
  };

  const handleAskConcept = async (concept: string) => {
    setIsLoading(true);
    const text = await geminiService.explainConcept(concept, lang);
    setAdvice(text);
    setIsLoading(false);
  };

  return (
    <div className="w-80 bg-kafka-dark border-l border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2 text-kafka-purple mb-1">
          <Sparkles size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wide">{t.title}</h3>
        </div>
        <p className="text-xs text-gray-500">{t.powered}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4 relative">
            {isLoading && (
                <div className="absolute top-2 right-2">
                    <Loader2 className="animate-spin text-kafka-purple" size={16}/>
                </div>
            )}
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {advice}
            </p>
        </div>

        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">{t.quickQ}</p>
            {[t.q1, t.q2, t.q3].map(q => (
                <button 
                    key={q}
                    onClick={() => handleAskConcept(q)}
                    className="w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 text-xs text-blue-300 transition-colors flex items-center gap-2"
                >
                    <MessageSquare size={12} />
                    {q}
                </button>
            ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-black/40 rounded p-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{t.totalProcessed}</span>
                <span className="text-green-400 font-mono">{gameState.totalMessagesProcessed}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
                <span>{t.systemLag}</span>
                <span className={`font-mono ${gameState.globalLag > 50 ? 'text-red-400' : 'text-blue-400'}`}>
                    {Math.floor(gameState.globalLag)}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export const AiTutor = memo(AiTutorInternal, (prev, next) => {
    if (prev.lang !== next.lang) return false;
    
    // Ignore X/Y node changes to prevent re-render during drag
    // Only re-render if stats change significantly or game status changes
    const pState = prev.gameState;
    const nState = next.gameState;

    if (pState.gameStatus !== nState.gameStatus) return false;
    if (pState.isRunning !== nState.isRunning) return false;
    if (pState.level !== nState.level) return false;
    
    // Check if node counts changed
    if (pState.nodes.length !== nState.nodes.length) return false;

    // Check lag diff (to throttle re-renders just for visual lag number)
    // Only update if lag changed by more than 1 or crossed a threshold? 
    // Actually, simply checking globalLag equality is fine because drag events don't change globalLag directly (game loop does)
    if (pState.globalLag !== nState.globalLag) return false;
    if (pState.totalMessagesProcessed !== nState.totalMessagesProcessed) return false;

    return true; 
});
