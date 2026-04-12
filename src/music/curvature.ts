import type { GpsPoint } from "../types/walk"

/**
 * 2点間の距離を緯度経度の差分から算出（度単位）
 * メートル換算ではなく、ノイズフィルタ用の相対比較に使う
 */
function vectorMag(dlat: number, dlng: number): number {
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

/**
 * 3点の成す曲率スコアを算出する（度数法）
 *
 * 返り値:
 *   0   = 完全な直線（方向転換なし）
 *   90  = 直角に曲がった
 *   180 = 完全な折り返し（Uターン）
 *
 * 端点やノイズ（移動距離が極小）の場合は 0 を返す
 */
export function calculateCurvature(
  prev: GpsPoint,
  current: GpsPoint,
  next: GpsPoint
): number {
  const v1lat = current.lat - prev.lat
  const v1lng = current.lng - prev.lng
  const v2lat = next.lat - current.lat
  const v2lng = next.lng - current.lng

  const mag1 = vectorMag(v1lat, v1lng)
  const mag2 = vectorMag(v2lat, v2lng)

  // ノイズフィルタ: 移動距離が約3m未満（0.0003度）なら直線扱い
  if (mag1 < 0.0003 || mag2 < 0.0003) return 0

  const dot = v1lat * v2lat + v1lng * v2lng
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  const theta = Math.acos(cosTheta) * (180 / Math.PI)

  // theta: 180=直線, 0=Uターン → curvature: 0=直線, 180=Uターン
  return 180 - theta
}

export type CurvatureBand = "low" | "mid" | "high"

/**
 * 曲率スコアを3段階に量子化
 */
export function quantizeCurvature(curvature: number): CurvatureBand {
  if (curvature < 30) return "low"
  if (curvature < 90) return "mid"
  return "high"
}
