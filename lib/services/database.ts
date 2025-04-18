import { MongoClient, ObjectId } from 'mongodb';
import { ChatMessage, ChatSession } from '../../types';

export class DatabaseService {
  private client: MongoClient;
  private dbName = 'venue-finder';

  constructor() {
    const uri = process.env.MONGODB_URI!;
    this.client = new MongoClient(uri);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async createSession(): Promise<string> {
    const db = this.client.db(this.dbName);
    const sessions = db.collection<ChatSession>('sessions');
    
    const session: ChatSession = {
      id: new ObjectId().toString(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await sessions.insertOne(session);
    return session.id;
  }

  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id'>): Promise<void> {
    const db = this.client.db(this.dbName);
    const sessions = db.collection<ChatSession>('sessions');

    const newMessage: ChatMessage = {
      id: new ObjectId().toString(),
      ...message
    };

    await sessions.updateOne(
      { id: sessionId },
      { 
        $push: { messages: newMessage },
        $set: { updatedAt: new Date() }
      }
    );
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const db = this.client.db(this.dbName);
    const sessions = db.collection<ChatSession>('sessions');
    return sessions.findOne({ id: sessionId });
  }

  async getSessions(): Promise<ChatSession[]> {
    const db = this.client.db(this.dbName);
    const sessions = db.collection<ChatSession>('sessions');
    return sessions
      .find()
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async close() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }
} 