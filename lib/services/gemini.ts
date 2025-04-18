import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '../../types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async processUserInput(message: string, history: ChatMessage[]): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: msg.content,
        })),
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to process message with AI');
    }
  }

  async extractVenuePreferences(message: string): Promise<{
    category: string;
    personCount: number;
    location: string;
  }> {
    const prompt = `Extract venue search preferences from the following message. Return a JSON with category (sports/personal/business/wedding/party), personCount, and location: "${message}"`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Venue preference extraction error:', error);
      throw new Error('Failed to extract venue preferences');
    }
  }
} 