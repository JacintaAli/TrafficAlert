// Location and geocoding services
const axios = require('axios');

// Geocode address to coordinates using Google Maps API
const geocodeAddress = async (address) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        formattedAddress: result.formatted_address,
        components: result.address_components,
        placeId: result.place_id
      };
    } else {
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Get route between two points using Google Directions API
const getRoute = async (origin, destination, options = {}) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      key: process.env.GOOGLE_MAPS_API_KEY,
      mode: options.mode || 'driving',
      departure_time: options.departureTime || 'now',
      traffic_model: options.trafficModel || 'best_guess',
      alternatives: options.alternatives || true
    };

    if (options.waypoints && options.waypoints.length > 0) {
      params.waypoints = options.waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      return response.data.routes.map(route => ({
        summary: route.summary,
        distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
        duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
        durationInTraffic: route.legs.reduce((total, leg) => 
          total + (leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value), 0
        ),
        polyline: route.overview_polyline.points,
        bounds: route.bounds,
        legs: route.legs.map(leg => ({
          distance: leg.distance,
          duration: leg.duration,
          durationInTraffic: leg.duration_in_traffic,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          startLocation: leg.start_location,
          endLocation: leg.end_location,
          steps: leg.steps.map(step => ({
            distance: step.distance,
            duration: step.duration,
            instructions: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            maneuver: step.maneuver,
            startLocation: step.start_location,
            endLocation: step.end_location
          }))
        }))
      }));
    } else {
      throw new Error(`Route calculation failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Route calculation error:', error);
    throw error;
  }
};

// Get nearby places using Google Places API
const getNearbyPlaces = async (latitude, longitude, options = {}) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      location: `${latitude},${longitude}`,
      radius: options.radius || 5000, // 5km default
      key: process.env.GOOGLE_MAPS_API_KEY
    };

    if (options.type) {
      params.type = options.type;
    }

    if (options.keyword) {
      params.keyword = options.keyword;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params
    });

    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        location: place.geometry.location,
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types,
        openNow: place.opening_hours ? place.opening_hours.open_now : null,
        photos: place.photos ? place.photos.map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : []
      }));
    } else {
      throw new Error(`Places search failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Places search error:', error);
    throw error;
  }
};

// Validate coordinates
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }
  
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  return { valid: true, latitude: lat, longitude: lng };
};

// Get address suggestions using Google Places Autocomplete
const getAddressSuggestions = async (input, options = {}) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const params = {
      input: input,
      key: process.env.GOOGLE_MAPS_API_KEY,
      types: options.types || 'address'
    };

    if (options.location && options.radius) {
      params.location = `${options.location.latitude},${options.location.longitude}`;
      params.radius = options.radius;
    }

    if (options.components) {
      params.components = options.components;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params
    });

    if (response.data.status === 'OK') {
      return response.data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
        types: prediction.types
      }));
    } else {
      throw new Error(`Address suggestions failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Address suggestions error:', error);
    throw error;
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getRoute,
  getNearbyPlaces,
  validateCoordinates,
  getAddressSuggestions
};
