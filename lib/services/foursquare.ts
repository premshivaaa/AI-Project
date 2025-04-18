import axios from 'axios';
import { Venue, VenueCategory, VenueSearchParams } from '../../types';

export class FoursquareService {
  private readonly baseUrl = 'https://api.foursquare.com/v3';
  private readonly apiKey = process.env.FOURSQUARE_API_KEY;

  private categoryMapping = {
    sports: '4bf58dd8d48988d184941735',
    personal: '4bf58dd8d48988d171941735',
    business: '4bf58dd8d48988d127941735',
    wedding: '56aa371be4b08b9a8d5734c5',
    party: '4bf58dd8d48988d171941735'
  };

  async searchVenues(params: VenueSearchParams): Promise<Venue[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/places/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        params: {
          query: params.category,
          near: params.location,
          limit: 10,
          categories: this.categoryMapping[params.category],
          sort: 'RATING'
        }
      });

      return response.data.results.map((venue: any) => ({
        id: venue.fsq_id,
        name: venue.name,
        category: params.category,
        address: venue.location.formatted_address,
        rating: venue.rating || 0,
        priceRange: venue.price || '$$',
        capacity: this.estimateCapacity(params.category, venue.size || 'medium'),
        photos: venue.photos || [],
        location: {
          lat: venue.geocodes.main.latitude,
          lng: venue.geocodes.main.longitude
        },
        mapUrl: `https://www.google.com/maps?q=${venue.geocodes.main.latitude},${venue.geocodes.main.longitude}`,
        description: venue.description || ''
      }));
    } catch (error) {
      console.error('Foursquare API Error:', error);
      throw new Error('Failed to fetch venues');
    }
  }

  private estimateCapacity(category: VenueCategory, size: string): number {
    const capacityMap = {
      sports: { small: 50, medium: 200, large: 1000 },
      personal: { small: 10, medium: 30, large: 100 },
      business: { small: 20, medium: 50, large: 200 },
      wedding: { small: 50, medium: 150, large: 500 },
      party: { small: 30, medium: 100, large: 300 }
    };

    return capacityMap[category][size as keyof typeof capacityMap[VenueCategory]] || 50;
  }
} 