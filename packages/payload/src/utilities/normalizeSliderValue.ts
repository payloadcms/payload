/** Keep fractional steps stable and align them to the configured minimum. */
export function normalizeSliderValue({
  max,
  min,
  step,
  value,
}: {
  max: number
  min: number
  step: number
  value: number
}): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return Number.isFinite(min) ? min : 0
  }
  const increment = Number.isFinite(step) && step > 0 ? step : 1
  const bounded = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
  const lastStep = Math.floor((max - min) / increment + 1e-10)
  const index = Math.min(lastStep, Math.max(0, Math.round((bounded - min) / increment)))

  return Number((min + index * increment).toPrecision(12))
}
