export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  address: string;
  rating: number;
  priceRange: string;
  capacity: number;
  photos: string[];
  location: {
    lat: number;
    lng: number;
  };
  mapUrl: string;
  bookingUrl?: string;
  description: string;
}

export type VenueCategory = 'sports' | 'personal' | 'business' | 'wedding' | 'party';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueSearchParams {
  category: VenueCategory;
  personCount: number;
  location: string;
  radius?: number;
} 