import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../lib/services/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const dbService = new DatabaseService();

  try {
    await dbService.connect();
    const sessions = await dbService.getSessions();
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Sessions API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await dbService.close();
  }
} 