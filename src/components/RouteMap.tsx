import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, useMap } from "react-leaflet"
import { useEffect, useMemo } from "react"
import L from "leaflet"
import type { GpsPoint } from "../types/walk"
import type { MusicNote } from "../music/generateMusic"

type Props = {
  points: GpsPoint[]
  notes?: MusicNote[]
  highlightIndex?: number | null
}

// Pentatonic 0-9 → hue: low (blue 240°) to high (red 0°)
function noteColor(noteIndex: number): string {
  const hue = 240 - (noteIndex / 9) * 240
  return `hsl(${hue}, 70%, 55%)`
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

export function RouteMap({ points, notes, highlightIndex = null }: Props) {
  const path = points.map((p) => [p.lat, p.lng] as [number, number])
  const center = points.length > 0
    ? [points[0].lat, points[0].lng] as [number, number]
    : [35.6812, 139.7671] as [number, number]

  const isPlaying = highlightIndex !== null && highlightIndex >= 0
  const pastPath = isPlaying ? path.slice(0, highlightIndex + 1) : []
  const currentPoint = isPlaying ? path[highlightIndex] : null

  // Map pointIndex → noteIndex for coloring GPS markers
  const noteByPoint = useMemo(() => {
    const m = new Map<number, number>()
    if (notes) {
      for (const n of notes) m.set(n.pointIndex, n.noteIndex)
    }
    return m
  }, [notes])

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
        <Polyline
          positions={path}
          color={isPlaying ? "#374151" : "#10b981"}
          weight={4}
        />
      )}
      {isPlaying && pastPath.length > 1 && (
        <Polyline positions={pastPath} color="#fbbf24" weight={5} />
      )}
      {noteByPoint.size > 0 &&
        points.map((p, i) => {
          const noteIdx = noteByPoint.get(i)
          if (noteIdx === undefined) return null
          const color = noteColor(noteIdx)
          return (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={4}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1,
              }}
            />
          )
        })}
      {points.length > 0 && (
        <>
          <Marker position={path[0]} />
          <Marker position={path[path.length - 1]} />
        </>
      )}
      {currentPoint && (
        <CircleMarker
          center={currentPoint}
          radius={10}
          pathOptions={{
            color: "#fbbf24",
            fillColor: "#fde047",
            fillOpacity: 0.9,
            weight: 3,
          }}
        />
      )}
      <FitBounds points={points} />
    </MapContainer>
  )
}
