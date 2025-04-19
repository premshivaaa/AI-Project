import axios from 'axios';
import { ChatMessage, VenueCategory } from '../../types';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export class GeminiService {
  private apiKey = process.env.GEMINI_API_KEY;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model = 'gemini-pro';

  async processUserInput(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log('Sending message to Gemini:', message);
      
      const prompt = {
        contents: [{
          parts: [{
            text: `User: ${message}\nAssistant:`
          }]
        }]
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        prompt,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to process message with AI');
    }
  }

  async extractVenuePreferences(message: string): Promise<{
    category: VenueCategory;
    personCount: number;
    location: string;
  }> {
    const prompt = {
      contents: [{
        parts: [{
          text: `Extract venue search preferences from this message. Return only a JSON object with these exact fields:
          - category: must be one of: "sports", "personal", "business", "wedding", or "party"
          - personCount: number of people (integer)
          - location: location name (string)

          Message: "${message}"

          Response format:
          {
            "category": "business",
            "personCount": 20,
            "location": "New York"
          }`
        }]
      }]
    };

    try {
      console.log('Extracting preferences from message');
      
      const response = await axios.post(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        prompt,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Invalid response format from Gemini API');
      }

      // Extract JSON from the response text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate category
      if (!['sports', 'personal', 'business', 'wedding', 'party'].includes(parsed.category)) {
        throw new Error(`Invalid venue category: ${parsed.category}`);
      }
      
      // Validate personCount
      if (!Number.isInteger(parsed.personCount) || parsed.personCount <= 0) {
        throw new Error('Invalid person count: must be a positive integer');
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
      console.error('Venue preference extraction error:', error.response?.data || error.message);
      throw new Error('Failed to extract venue preferences. Please try again with a clearer message.');
    }
  }
} 
