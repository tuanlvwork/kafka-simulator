
import { GoogleGenAI } from "@google/genai";
import { GameState, NodeType, Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = "gemini-2.5-flash";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction(lang: Language): string {
    const langInstruction = lang === 'vi' 
      ? "Respond strictly in Vietnamese. Use standard Vietnamese terminology for Kafka where appropriate, or keep English terms like 'Broker', 'Topic', 'Partition', 'Consumer Group' but explain in Vietnamese."
      : "Respond strictly in English.";

    return `
      You are the "Senior Architect" in a simulation game called "StreamWeaver". 
      The user is learning Apache Kafka by building pipelines.
      Your goal is to provide brief, helpful, and technically accurate advice based on the current board state.
      Keep responses under 3 sentences unless asked for a detailed explanation.
      Tone: Encouraging, professional, technical but accessible.
      ${langInstruction}

      Rules:
      1. If Lag is high (>50), suggest adding Consumers or Partitions.
      2. If throughput is low, suggest adding Producers.
      3. If the user asks "What is X?", explain the Kafka concept X simply.
    `;
  }

  async analyzeBoard(gameState: GameState, lang: Language): Promise<string> {
    try {
      const producerCount = gameState.nodes.filter(n => n.type === NodeType.PRODUCER).length;
      const topicCount = gameState.nodes.filter(n => n.type === NodeType.TOPIC).length;
      const consumerCount = gameState.nodes.filter(n => n.type === NodeType.CONSUMER).length;

      const prompt = `
        Current Game State:
        - Status: ${gameState.gameStatus}
        - Level: ${gameState.level}
        - Global Lag: ${gameState.globalLag} (Max is 100 before crash)
        - Topology: ${producerCount} Producers, ${topicCount} Topics, ${consumerCount} Consumers.
        
        Analyze this situation. If the lag is high, warn them. If they just started, give them a mission.
        Return only the advice text.
      `;

      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          systemInstruction: this.getSystemInstruction(lang),
        }
      });

      return response.text || (lang === 'vi' ? "Tiếp tục theo dõi hệ thống." : "Keep monitoring your pipeline.");
    } catch (error) {
      console.error("Gemini API Error:", error);
      return lang === 'vi' ? "Kiến trúc sư trưởng đang ngoại tuyến (Kiểm tra API Key)." : "Senior Architect is currently offline (Check API Key).";
    }
  }

  async explainConcept(concept: string, lang: Language): Promise<string> {
     try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: `Explain the Kafka concept: "${concept}" in the context of this game. Keep it short.`,
        config: {
          systemInstruction: this.getSystemInstruction(lang),
        }
      });
      return response.text || (lang === 'vi' ? "Không có thông tin." : "Information unavailable.");
    } catch (error) {
      return lang === 'vi' ? "Không thể lấy định nghĩa." : "Could not retrieve definition.";
    }
  }
}

export const geminiService = new GeminiService();
