import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet"
import { useEffect } from "react"
import type { GpsPoint } from "../types/walk"

type Props = {
  points: GpsPoint[]
}

function MapUpdater({ points }: { points: GpsPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 0) {
      const last = points[points.length - 1]
      map.setView([last.lat, last.lng], map.getZoom())
    }
  }, [points, map])

  return null
}

export function WalkMap({ points }: Props) {
  const center =
    points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng] as [number, number]
      : [35.6812, 139.7671] as [number, number] // default: Tokyo

  const path = points.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <MapContainer
      center={center}
      zoom={17}
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
        <Marker position={center} />
      )}
      <MapUpdater points={points} />
    </MapContainer>
  )
}
