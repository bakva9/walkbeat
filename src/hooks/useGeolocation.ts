import { useState, useEffect, useRef, useCallback } from "react"
import type { GpsPoint } from "../types/walk"

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useGeolocation(active: boolean) {
  const [points, setPoints] = useState<GpsPoint[]>([])
  const watchIdRef = useRef<number | null>(null)

  const addPoint = useCallback((position: GeolocationPosition) => {
    setPoints((prev) => {
      const now = position.timestamp
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      let speed = 0
      if (prev.length > 0) {
        const last = prev[prev.length - 1]
        const dist = haversine(last.lat, last.lng, lat, lng) // km
        const dt = (now - last.timestamp) / 3600000 // hours
        if (dt > 0) speed = dist / dt // km/h
      }

      return [...prev, { lat, lng, timestamp: now, speed }]
    })
  }, [])

  useEffect(() => {
    if (!active) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      addPoint,
      (err) => console.error("GPS error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [active, addPoint])

  const reset = useCallback(() => setPoints([]), [])

  return { points, reset }
}
