import type { GpsPoint } from "../types/walk"
import { calculateCurvature } from "./curvature"

export type SectionPattern = "calm" | "walk" | "active" | "break"

export type SectionInfo = {
  startIndex: number
  endIndex: number // exclusive
  startTime: number // seconds from music start (compressed)
  endTime: number // seconds (compressed)
  avgSpeed: number // km/h
  curvatureScore: number // degrees (average)
  distance: number // meters
  pattern: SectionPattern
}

const SECTION_DURATION = 30 // seconds

/**
 * 2つのGPSポイント間の距離をメートルで近似計算
 * 北緯35度付近の簡易式
 */
function distanceMeters(a: GpsPoint, b: GpsPoint): number {
  const dLat = (b.lat - a.lat) * 111000
  const dLng = (b.lng - a.lng) * 91000
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

type SpeedBand = "low" | "mid" | "high"
type CurvBand = "low" | "mid" | "high"
type DistBand = "low" | "mid" | "high"

function quantizeSpeed(v: number): SpeedBand {
  if (v < 3) return "low"
  if (v < 5) return "mid"
  return "high"
}

function quantizeCurv(c: number): CurvBand {
  if (c < 30) return "low"
  if (c < 90) return "mid"
  return "high"
}

function quantizeDist(d: number): DistBand {
  if (d < 30) return "low"
  if (d < 60) return "mid"
  return "high"
}

function determinePattern(
  speed: SpeedBand,
  curv: CurvBand,
  dist: DistBand
): SectionPattern {
  if (dist === "low") return "break"
  if (speed === "low" && curv === "low") return "calm"
  if (speed === "high" || curv === "high") return "active"
  return "walk"
}

/**
 * GPSポイント列をセクションに分割し、各セクションのパターンを判定する
 *
 * @param points GPSポイント列
 * @param totalMusicDuration 圧縮後の曲全体の長さ（秒）
 */
export function analyzeSections(
  points: GpsPoint[],
  totalMusicDuration: number
): SectionInfo[] {
  if (points.length < 2) return []

  const startTimestamp = points[0].timestamp
  const totalWalkDuration =
    (points[points.length - 1].timestamp - startTimestamp) / 1000
  const sectionCount = Math.max(1, Math.ceil(totalWalkDuration / SECTION_DURATION))
  const compressionRatio =
    totalWalkDuration > 0 ? totalMusicDuration / totalWalkDuration : 1

  // Group points into sections by timestamp
  const sectionPoints: GpsPoint[][] = Array.from(
    { length: sectionCount },
    () => []
  )
  for (const p of points) {
    const elapsed = (p.timestamp - startTimestamp) / 1000
    const idx = Math.min(
      Math.floor(elapsed / SECTION_DURATION),
      sectionCount - 1
    )
    sectionPoints[idx].push(p)
  }

  const sections: SectionInfo[] = []

  for (let s = 0; s < sectionCount; s++) {
    const pts = sectionPoints[s]
    if (pts.length === 0) continue

    // Start/end indices in original points array
    const startIndex = points.indexOf(pts[0])
    const endIndex = points.indexOf(pts[pts.length - 1]) + 1

    // Timing (compressed)
    const sectionStartSec = s * SECTION_DURATION * compressionRatio
    const sectionEndSec = Math.min(
      (s + 1) * SECTION_DURATION * compressionRatio,
      totalMusicDuration
    )

    // Feature A: average speed
    const avgSpeed =
      pts.reduce((sum, p) => sum + p.speed, 0) / pts.length

    // Feature B: average curvature
    let curvSum = 0
    let curvCount = 0
    for (let i = 1; i < pts.length - 1; i++) {
      curvSum += calculateCurvature(pts[i - 1], pts[i], pts[i + 1])
      curvCount++
    }
    const curvatureScore = curvCount > 0 ? curvSum / curvCount : 0

    // Feature C: total distance
    let dist = 0
    for (let i = 1; i < pts.length; i++) {
      dist += distanceMeters(pts[i - 1], pts[i])
    }

    // Quantize and determine pattern
    const pattern = determinePattern(
      quantizeSpeed(avgSpeed),
      quantizeCurv(curvatureScore),
      quantizeDist(dist)
    )

    sections.push({
      startIndex,
      endIndex,
      startTime: sectionStartSec,
      endTime: sectionEndSec,
      avgSpeed,
      curvatureScore,
      distance: dist,
      pattern,
    })
  }

  return sections
}
