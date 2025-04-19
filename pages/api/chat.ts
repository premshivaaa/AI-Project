import { NextApiRequest, NextApiResponse } from 'next';
import { GeminiService } from '../../lib/services/gemini';
import { FoursquareService } from '../../lib/services/foursquare';
import { DatabaseService } from '../../lib/services/database';

const geminiService = new GeminiService();
const foursquareService = new FoursquareService();
const dbService = new DatabaseService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('Processing message:', message);

    // Create or retrieve session
    let currentSessionId = sessionId;
    try {
      if (!currentSessionId) {
        await dbService.connect();
        currentSessionId = await dbService.createSession();
        console.log('Created new session:', currentSessionId);
      }

      // Get session history
      const session = await dbService.getSession(currentSessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      console.log('Retrieved session:', currentSessionId);

      // Add user message to history
      await dbService.addMessage(currentSessionId, {
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      console.log('Added user message to history');

      // Extract venue preferences using AI
      console.log('Extracting venue preferences...');
      const preferences = await geminiService.extractVenuePreferences(message);
      console.log('Extracted preferences:', preferences);

      // Search for venues
      console.log('Searching venues...');
      const venues = await foursquareService.searchVenues({
        category: preferences.category,
        personCount: preferences.personCount,
        location: preferences.location
      });
      console.log('Found venues:', venues.length);

      // Generate AI response
      console.log('Generating AI response...');
      const venueDescriptions = venues.map(venue => 
        `${venue.name} (${venue.category}): ${venue.address}, Rating: ${venue.rating}, Price: ${venue.priceRange}, Capacity: ${venue.capacity}`
      ).join('\n');

      const aiResponse = await geminiService.processUserInput(
        `Here are some venues that match your criteria:\n${venueDescriptions}`,
        session.messages
      );
      console.log('Generated AI response');

      // Add AI response to history
      await dbService.addMessage(currentSessionId, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      console.log('Added AI response to history');

      return res.status(200).json({
        sessionId: currentSessionId,
        message: aiResponse,
        venues: venues
      });
    } catch (error) {
      console.error('Session/DB Error:', error);
      throw error;
    } finally {
      await dbService.close();
    }
  } catch (error: any) {
    console.error('API Error:', error);
    // Return a more specific error message
    return res.status(500).json({ 
      message: 'An error occurred while processing your request',
      error: error.message || 'Internal server error',
      type: error.name || 'UnknownError'
    });
  }
} 
