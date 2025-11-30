import { GoogleGenAI } from "@google/genai";
import { GameState, NodeType } from "../types";

const SYSTEM_INSTRUCTION = `
You are the "Senior Architect" in a simulation game called "StreamWeaver". 
The user is learning Apache Kafka by building pipelines.
Your goal is to provide brief, helpful, and technically accurate advice based on the current board state.
Keep responses under 3 sentences unless asked for a detailed explanation.
Tone: Encouraging, professional, technical but accessible.

Rules:
1. If Lag is high (>50), suggest adding Consumers or Partitions.
2. If throughput is low, suggest adding Producers.
3. If the user asks "What is X?", explain the Kafka concept X simply.
`;

export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = "gemini-2.5-flash";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeBoard(gameState: GameState): Promise<string> {
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
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      return response.text || "Keep monitoring your pipeline.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Senior Architect is currently offline (Check API Key).";
    }
  }

  async explainConcept(concept: string): Promise<string> {
     try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: `Explain the Kafka concept: "${concept}" in the context of this game. Keep it short.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
      return response.text || "Information unavailable.";
    } catch (error) {
      return "Could not retrieve definition.";
    }
  }
}

export const geminiService = new GeminiService();