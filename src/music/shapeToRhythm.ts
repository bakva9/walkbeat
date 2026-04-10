export type RhythmParams = {
  duration: number // seconds
  velocity: number // 0.0 - 1.0
  isRest: boolean
}

/**
 * 速度から音符の長さを決定する（第2層）
 * ~2 km/h → 2s, ~4 km/h → 0.5s, ~6 km/h → 0.25s, ~8+ km/h → 0.125s
 */
function speedToDuration(speed: number): number {
  if (speed <= 0.5) return 0 // rest (stopped)
  if (speed <= 2) return 2.0
  if (speed <= 4) return 0.5
  if (speed <= 6) return 0.25
  return 0.125
}

/**
 * 加速度（速度の変化）から強弱を決定する
 */
function accelerationToVelocity(
  currentSpeed: number,
  prevSpeed: number
): number {
  const accel = currentSpeed - prevSpeed
  // Map acceleration to velocity range 0.3 - 1.0
  const base = 0.6
  const v = base + accel * 0.1
  return Math.max(0.3, Math.min(1.0, v))
}

/**
 * 停止検知を含むリズムパラメータの計算
 */
export function shapeToRhythm(
  speed: number,
  prevSpeed: number,
  consecutiveStops: number
): RhythmParams {
  // 3 consecutive stops → rest
  const isRest = speed < 0.5 && consecutiveStops >= 3

  return {
    duration: speedToDuration(speed),
    velocity: isRest ? 0 : accelerationToVelocity(speed, prevSpeed),
    isRest,
  }
}
