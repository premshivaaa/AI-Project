import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, VenueCategory } from '../../types';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  async processUserInput(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log('Starting chat with history length:', history.length);
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: msg.content,
        })),
      });

      console.log('Sending message to Gemini:', message);
      const result = await chat.sendMessage(message);
      const response = await result.response;
      console.log('Received response from Gemini');
      return response.text();
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      if (error.message?.includes('API key')) {
        throw new Error('Invalid or missing API key');
      }
      throw new Error(`Failed to process message with AI: ${error.message}`);
    }
  }

  async extractVenuePreferences(message: string): Promise<{
    category: VenueCategory;
    personCount: number;
    location: string;
  }> {
    const prompt = `Extract venue search preferences from the following message. Return a valid JSON object with these exact fields:
    - category: must be one of these exact values: "sports", "personal", "business", "wedding", or "party"
    - personCount: number of people (must be a number)
    - location: location name (as a string)
    
    For the message: "${message}"
    
    Response must be in this exact format:
    {
      "category": "business",
      "personCount": 10,
      "location": "New York"
    }`;
    
    try {
      console.log('Sending preference extraction prompt to Gemini');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      console.log('Received preference extraction response');
      
      let parsed;
      try {
        parsed = JSON.parse(response.text());
      } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('Failed to parse AI response as JSON');
      }
      
      // Validate category
      if (!['sports', 'personal', 'business', 'wedding', 'party'].includes(parsed.category)) {
        throw new Error(`Invalid venue category: ${parsed.category}`);
      }
      
      // Validate personCount
      if (typeof parsed.personCount !== 'number' || parsed.personCount <= 0) {
        throw new Error('Invalid person count: must be a positive number');
      }
      
      // Validate location
      if (!parsed.location || typeof parsed.location !== 'string') {
        throw new Error('Invalid location: must be a non-empty string');
      }
      
      return {
        category: parsed.category as VenueCategory,
        personCount: parsed.personCount,
        location: parsed.location
      };
    } catch (error: any) {
      console.error('Venue preference extraction error:', error);
      throw new Error(`Failed to extract venue preferences: ${error.message}`);
    }
  }
} 
