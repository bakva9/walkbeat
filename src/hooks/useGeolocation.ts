import { useState, useEffect, useRef, useCallback } from "react"
import { Geolocation } from "@capacitor/geolocation"
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
  const watchIdRef = useRef<string | null>(null)

  const addPoint = useCallback((lat: number, lng: number, timestamp: number) => {
    setPoints((prev) => {
      let speed = 0
      if (prev.length > 0) {
        const last = prev[prev.length - 1]
        const dist = haversine(last.lat, last.lng, lat, lng) // km
        const dt = (timestamp - last.timestamp) / 3600000 // hours
        if (dt > 0) speed = dist / dt // km/h
      }

      return [...prev, { lat, lng, timestamp, speed }]
    })
  }, [])

  useEffect(() => {
    if (!active) return

    let cancelled = false

    const startWatching = async () => {
      try {
        const permission = await Geolocation.requestPermissions()
        if (permission.location !== "granted") {
          console.error("Location permission denied")
          return
        }

        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000 },
          (position, err) => {
            if (cancelled) return
            if (err) {
              console.error("GPS error:", err)
              return
            }
            if (position) {
              addPoint(
                position.coords.latitude,
                position.coords.longitude,
                position.timestamp
              )
            }
          }
        )
        watchIdRef.current = id
      } catch (err) {
        console.error("Failed to start watching position:", err)
      }
    }

    startWatching()

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch({ id: watchIdRef.current })
        watchIdRef.current = null
      }
    }
  }, [active, addPoint])

  const reset = useCallback(() => setPoints([]), [])

  return { points, reset }
}
