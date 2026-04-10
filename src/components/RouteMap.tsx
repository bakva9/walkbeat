import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet"
import { useEffect } from "react"
import L from "leaflet"
import type { GpsPoint } from "../types/walk"

type Props = {
  points: GpsPoint[]
}

function FitBounds({ points }: { points: GpsPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [points, map])

  return null
}

export function RouteMap({ points }: Props) {
  const path = points.map((p) => [p.lat, p.lng] as [number, number])
  const center = points.length > 0
    ? [points[0].lat, points[0].lng] as [number, number]
    : [35.6812, 139.7671] as [number, number]

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 1 && (
        <Polyline positions={path} color="#10b981" weight={4} />
      )}
      {points.length > 0 && (
        <>
          <Marker position={path[0]} />
          <Marker position={path[path.length - 1]} />
        </>
      )}
      <FitBounds points={points} />
    </MapContainer>
  )
}
