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

    // Create or retrieve session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      await dbService.connect();
      currentSessionId = await dbService.createSession();
    }

    // Get session history
    const session = await dbService.getSession(currentSessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add user message to history
    await dbService.addMessage(currentSessionId, {
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Extract venue preferences using AI
    const preferences = await geminiService.extractVenuePreferences(message);

    // Search for venues
    const venues = await foursquareService.searchVenues({
      category: preferences.category,
      personCount: preferences.personCount,
      location: preferences.location
    });

    // Generate AI response
    const venueDescriptions = venues.map(venue => 
      `${venue.name} (${venue.category}): ${venue.address}, Rating: ${venue.rating}, Price: ${venue.priceRange}, Capacity: ${venue.capacity}`
    ).join('\n');

    const aiResponse = await geminiService.processUserInput(
      `Here are some venues that match your criteria:\n${venueDescriptions}`,
      session.messages
    );

    // Add AI response to history
    await dbService.addMessage(currentSessionId, {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    return res.status(200).json({
      sessionId: currentSessionId,
      message: aiResponse,
      venues: venues
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await dbService.close();
  }
} 