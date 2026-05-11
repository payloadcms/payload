/**
 * Lightweight hierarchical span profiler for config sanitization.
 *
 * No-op unless PAYLOAD_PROFILE_SANITIZE=1.
 *
 * Records every span with its parent, computing self-time vs children-time
 * for accurate hotspot analysis. Sequential async-await flow means a simple
 * stack works (no concurrent overlap between spans within sanitizeConfig).
 */

const enabled = process.env.PAYLOAD_PROFILE_SANITIZE === '1'

export type SpanRecord = {
  childrenTime: number
  depth: number
  duration: number
  meta?: string
  name: string
  parent: number
  selfTime: number
  start: number
}

const records: SpanRecord[] = []
const stack: number[] = []

export const profilerEnabled = enabled

export const startSpan = (name: string, meta?: string): number => {
  if (!enabled) {
    return -1
  }
  const idx = records.length
  const parent = stack.length > 0 ? stack[stack.length - 1]! : -1
  records.push({
    name,
    childrenTime: 0,
    depth: stack.length,
    duration: 0,
    meta,
    parent,
    selfTime: 0,
    start: performance.now(),
  })
  stack.push(idx)
  return idx
}

export const endSpan = (idx: number): void => {
  if (idx < 0) {
    return
  }
  const rec = records[idx]!
  rec.duration = performance.now() - rec.start
  rec.selfTime = rec.duration - rec.childrenTime
  if (rec.parent >= 0) {
    records[rec.parent]!.childrenTime += rec.duration
  }
  stack.pop()
}

export const profileAsync = async <T>(
  name: string,
  fn: () => Promise<T>,
  meta?: string,
): Promise<T> => {
  if (!enabled) {
    return fn()
  }
  const idx = startSpan(name, meta)
  try {
    return await fn()
  } finally {
    endSpan(idx)
  }
}

export const profileSync = <T>(name: string, fn: () => T, meta?: string): T => {
  if (!enabled) {
    return fn()
  }
  const idx = startSpan(name, meta)
  try {
    return fn()
  } finally {
    endSpan(idx)
  }
}

export const resetProfiler = (): void => {
  records.length = 0
  stack.length = 0
}

export const getProfilerRecords = (): SpanRecord[] => records

type Aggregate = {
  childrenTime: number
  count: number
  maxSelf: number
  maxTotal: number
  name: string
  totalSelf: number
  totalTime: number
}

export const aggregateByName = (): Aggregate[] => {
  const map = new Map<string, Aggregate>()
  for (const rec of records) {
    let agg = map.get(rec.name)
    if (!agg) {
      agg = {
        name: rec.name,
        childrenTime: 0,
        count: 0,
        maxSelf: 0,
        maxTotal: 0,
        totalSelf: 0,
        totalTime: 0,
      }
      map.set(rec.name, agg)
    }
    agg.count += 1
    agg.totalTime += rec.duration
    agg.totalSelf += rec.selfTime
    agg.childrenTime += rec.childrenTime
    if (rec.duration > agg.maxTotal) {
      agg.maxTotal = rec.duration
    }
    if (rec.selfTime > agg.maxSelf) {
      agg.maxSelf = rec.selfTime
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalSelf - a.totalSelf)
}
