export type GpsPoint = {
  lat: number
  lng: number
  timestamp: number
  speed: number // km/h
}

export type Walk = {
  id: string
  startedAt: string
  endedAt: string
  distance: number // km
  duration: number // seconds
  points: GpsPoint[]
}

export type Screen = "home" | "walking" | "result"
