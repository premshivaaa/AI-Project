import axios from 'axios';
import { Venue, VenueCategory, VenueSearchParams } from '../../types';

if (!process.env.FOURSQUARE_API_KEY) {
  throw new Error('FOURSQUARE_API_KEY environment variable is not set');
}

export class FoursquareService {
  private apiKey = process.env.FOURSQUARE_API_KEY;
  private baseUrl = 'https://api.foursquare.com/v3/places/search';

  private categoryMapping = {
    sports: '4bf58dd8d48988d184941735',
    personal: '4bf58dd8d48988d171941735',
    business: '4bf58dd8d48988d127941735',
    wedding: '56aa371be4b08b9a8d5734c5',
    party: '4bf58dd8d48988d171941735'
  };

  async searchVenues(params: VenueSearchParams): Promise<Venue[]> {
    try {
      console.log('Searching venues with params:', params);

      const response = await axios.get(this.baseUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': this.apiKey
        },
        params: {
          query: params.category,
          near: params.location,
          limit: 10,
          categories: this.categoryMapping[params.category],
          sort: 'RATING'
        },
        timeout: 10000
      });

      console.log('Received venues from Foursquare');
      
      return response.data.results.map((venue: any) => ({
        id: venue.fsq_id,
        name: venue.name,
        category: params.category,
        address: venue.location?.formatted_address || 'Address not available',
        rating: venue.rating || 0,
        priceRange: venue.price || '$$',
        capacity: this.estimateCapacity(params.category, params.personCount),
        photos: venue.photos || [],
        location: {
          lat: venue.geocodes?.main?.latitude || 0,
          lng: venue.geocodes?.main?.longitude || 0
        },
        mapUrl: venue.geocodes?.main ? 
          `https://www.google.com/maps?q=${venue.geocodes.main.latitude},${venue.geocodes.main.longitude}` : 
          '#',
        description: venue.description || ''
      }));
    } catch (error: any) {
      console.error('Foursquare API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch venues. Please try again.');
    }
  }

  private estimateCapacity(category: VenueCategory, requestedCapacity: number): number {
    // Return a capacity that's at least 20% more than requested
    const minCapacity = Math.ceil(requestedCapacity * 1.2);
    
    const baseCapacity = {
      sports: 200,
      personal: 50,
      business: 100,
      wedding: 150,
      party: 100
    }[category] || 50;

    return Math.max(baseCapacity, minCapacity);
  }
} 
