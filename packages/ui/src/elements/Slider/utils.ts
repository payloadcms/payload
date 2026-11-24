import { normalizeSliderValue } from 'payload/shared'

export { normalizeSliderValue } from 'payload/shared'

/** FPL sliders briefly snap near a hint, within 2% of the track's range. */
export function snapSliderToHint({
  hints,
  max,
  min,
  step,
  value,
}: {
  hints: number[]
  max: number
  min: number
  step: number
  value: number
}): number {
  const normalized = normalizeSliderValue({ max, min, step, value })
  const threshold = (max - min) * 0.02
  let result = normalized
  let distance = Infinity

  for (const hint of hints) {
    if (hint < min || hint > max || !Number.isFinite(hint)) {
      continue
    }
    const aligned = normalizeSliderValue({ max, min, step, value: hint })
    const nextDistance = Math.abs(hint - normalized)

    if (
      Math.abs(aligned - hint) <= step * 1e-9 &&
      nextDistance <= threshold &&
      nextDistance < distance
    ) {
      result = hint
      distance = nextDistance
    }
  }

  return result
}

/** Large keyboard steps stop at the first hint crossed, just like FPL. */
export function stopSliderAtHint({
  from,
  hints,
  to,
}: {
  from: number
  hints: number[]
  to: number
}): number {
  const candidates = hints.filter((hint) =>
    to > from ? hint > from && hint <= to : hint < from && hint >= to,
  )

  return candidates.length ? (to > from ? Math.min(...candidates) : Math.max(...candidates)) : to
}
