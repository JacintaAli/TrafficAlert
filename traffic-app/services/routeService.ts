import { Alert } from 'react-native'

export interface RoutePoint {
  latitude: number
  longitude: number
}

export interface Route {
  id: string
  name: string
  description: string
  distance: string
  duration: string
  traffic: 'light' | 'moderate' | 'heavy'
  incidents: number
  points: RoutePoint[]
  steps: RouteStep[]
  tollCost?: number
  fuelCost?: number
}

export interface RouteStep {
  instruction: string
  distance: string
  duration: string
  maneuver: string
}

class RouteService {
  private googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY' // Replace with your API key

  // Get route suggestions using Google Directions API
  async getRouteSuggestions(
    origin: RoutePoint,
    destination: RoutePoint,
    alternatives: boolean = true
  ): Promise<Route[]> {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `alternatives=${alternatives}&` +
        `traffic_model=best_guess&` +
        `departure_time=now&` +
        `key=${this.googleMapsApiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK') {
        return this.parseGoogleDirectionsResponse(data)
      } else {
        throw new Error(data.error_message || 'Failed to get directions')
      }
    } catch (error) {
      console.error('Route service error:', error)
      // Fallback to dummy data for demo
      return this.getDummyRoutes(origin, destination)
    }
  }

  // Parse Google Directions API response
  private parseGoogleDirectionsResponse(data: any): Route[] {
    return data.routes.map((route: any, index: number) => {
      const leg = route.legs[0]
      const points = this.decodePolyline(route.overview_polyline.points)
      
      return {
        id: `route_${index}`,
        name: this.generateRouteName(route, index),
        description: leg.start_address + ' to ' + leg.end_address,
        distance: leg.distance.text,
        duration: leg.duration_in_traffic?.text || leg.duration.text,
        traffic: this.determineTrafficLevel(leg.duration_in_traffic?.value, leg.duration.value),
        incidents: Math.floor(Math.random() * 3), // Would come from traffic data
        points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver || 'straight'
        })),
        tollCost: this.estimateTollCost(route),
        fuelCost: this.estimateFuelCost(leg.distance.value)
      }
    })
  }

  // Decode Google polyline
  private decodePolyline(encoded: string): RoutePoint[] {
    const points: RoutePoint[] = []
    let index = 0
    let lat = 0
    let lng = 0

    while (index < encoded.length) {
      let b: number
      let shift = 0
      let result = 0

      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)

      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0

      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)

      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
      lng += dlng

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      })
    }

    return points
  }

  // Utility functions
  private generateRouteName(route: any, index: number): string {
    const names = ['Fastest Route', 'Scenic Route', 'Highway Route', 'Local Route']
    return names[index] || `Route ${index + 1}`
  }

  private determineTrafficLevel(trafficDuration?: number, normalDuration?: number): 'light' | 'moderate' | 'heavy' {
    if (!trafficDuration || !normalDuration) return 'light'
    
    const ratio = trafficDuration / normalDuration
    if (ratio > 1.5) return 'heavy'
    if (ratio > 1.2) return 'moderate'
    return 'light'
  }

  private estimateTollCost(route: any): number {
    // Simple estimation - would need real toll data
    const hasTolls = route.summary?.toLowerCase().includes('toll') || 
                    route.copyrights?.toLowerCase().includes('toll')
    return hasTolls ? Math.floor(Math.random() * 10) + 2 : 0
  }

  private estimateFuelCost(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000
    const fuelEfficiency = 12 // km per liter
    const fuelPrice = 1.5 // price per liter
    return Math.round((distanceKm / fuelEfficiency) * fuelPrice * 100) / 100
  }

  // Fallback dummy data
  private getDummyRoutes(origin: RoutePoint, destination: RoutePoint): Route[] {
    const distance = this.calculateDistance(origin, destination)
    
    return [
      {
        id: 'route_1',
        name: 'Fastest Route',
        description: 'Via main highways',
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.round(distance * 2)} min`,
        traffic: 'light',
        incidents: 0,
        points: [origin, destination],
        steps: [
          {
            instruction: 'Head north on current road',
            distance: '0.5 km',
            duration: '1 min',
            maneuver: 'straight'
          }
        ],
        tollCost: 0,
        fuelCost: Math.round(distance * 0.15 * 100) / 100
      },
      {
        id: 'route_2',
        name: 'Scenic Route',
        description: 'Avoid highways',
        distance: `${(distance * 1.2).toFixed(1)} km`,
        duration: `${Math.round(distance * 2.5)} min`,
        traffic: 'moderate',
        incidents: 1,
        points: [origin, destination],
        steps: [
          {
            instruction: 'Take local roads',
            distance: '1.2 km',
            duration: '3 min',
            maneuver: 'turn-right'
          }
        ],
        tollCost: 0,
        fuelCost: Math.round(distance * 1.2 * 0.15 * 100) / 100
      }
    ]
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

export const routeService = new RouteService()
