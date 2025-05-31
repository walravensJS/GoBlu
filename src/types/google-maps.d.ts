// src/types/google-maps.d.ts

declare global {
    interface Window {
      google: typeof google;
    }
  }
  
  declare namespace google.maps.places {
    interface PlaceResult {
      place_id?: string;
      name?: string;
      formatted_address?: string;
      rating?: number;
      price_level?: number;
      photos?: PlacePhoto[];
      formatted_phone_number?: string;
      website?: string;
      opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
      };
      types?: string[];
    }
  
    interface PlacePhoto {
      photo_reference: string;
      getUrl(options: { maxWidth: number }): string;
    }
  
    interface TextSearchRequest {
      query: string;
      fields?: string[];
    }
  
    interface PlacesService {
      textSearch(
        request: TextSearchRequest,
        callback: (
          results: PlaceResult[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }
  
    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }
  }
  
  export {};