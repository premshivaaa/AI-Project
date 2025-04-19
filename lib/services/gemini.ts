import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, VenueCategory } from '../../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    category: VenueCategory;
    personCount: number;
    location: string;
  }> {
    const prompt = `Extract venue search preferences from the following message. Return a JSON with these exact fields:
    - category: must be one of these exact values: "sports", "personal", "business", "wedding", or "party"
    - personCount: number of people
    - location: location name
    
    For the message: "${message}"`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const parsed = JSON.parse(response.text());
      
      // Validate category
      if (!['sports', 'personal', 'business', 'wedding', 'party'].includes(parsed.category)) {
        throw new Error('Invalid venue category');
      }
      
      return {
        category: parsed.category as VenueCategory,
        personCount: Number(parsed.personCount),
        location: parsed.location
      };
    } catch (error) {
      console.error('Venue preference extraction error:', error);
      throw new Error('Failed to extract venue preferences');
    }
  }
} 
