import { performance } from 'perf_hooks'

const isEnabled = (): boolean => process.env.PAYLOAD_DEBUG_TIMING === 'true'

// Track nested calls to build hierarchy
const callStack: string[] = []

/**
 * Wrap a synchronous function with timing instrumentation.
 * Only active when PAYLOAD_DEBUG_TIMING=true.
 */
export function timeSync<T>(name: string, fn: () => T): T {
  if (!isEnabled()) {
    return fn()
  }

  const fullName = callStack.length ? `${callStack.at(-1)} > ${name}` : name
  callStack.push(name)

  performance.mark(`${fullName}:start`)
  try {
    const result = fn()
    performance.mark(`${fullName}:end`)
    performance.measure(fullName, `${fullName}:start`, `${fullName}:end`)
    return result
  } finally {
    callStack.pop()
  }
}

/**
 * Wrap an async function with timing instrumentation.
 * Only active when PAYLOAD_DEBUG_TIMING=true.
 */
export async function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!isEnabled()) {
    return fn()
  }

  const fullName = callStack.length ? `${callStack.at(-1)} > ${name}` : name
  callStack.push(name)

  performance.mark(`${fullName}:start`)
  try {
    const result = await fn()
    performance.mark(`${fullName}:end`)
    performance.measure(fullName, `${fullName}:start`, `${fullName}:end`)
    return result
  } finally {
    callStack.pop()
  }
}

/**
 * Print aggregated timing results to console.
 * Shows operation name, total time, percentage, count, and average.
 */
export function printProfileResults(): void {
  if (!isEnabled()) {
    return
  }

  const entries = performance.getEntriesByType('measure')
  const grouped = new Map<string, { count: number; total: number }>()

  for (const entry of entries) {
    const existing = grouped.get(entry.name) ?? { count: 0, total: 0 }
    grouped.set(entry.name, {
      count: existing.count + 1,
      total: existing.total + entry.duration,
    })
  }

  // Calculate total time from top-level operations only (no " > " in name)
  const topLevelTime = Array.from(grouped.entries())
    .filter(([name]) => !name.includes(' > '))
    .reduce((sum, [, v]) => sum + v.total, 0)

  const sorted = Array.from(grouped.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, { count, total }]) => ({
      name,
      avg: `${(total / count).toFixed(2)}ms`,
      count,
      pct: `${((total / topLevelTime) * 100).toFixed(1)}%`,
      total: `${total.toFixed(2)}ms`,
    }))

  // eslint-disable-next-line no-console
  console.log('\n=== sanitizeConfig Profile ===')
  // eslint-disable-next-line no-console
  console.table(sorted)

  performance.clearMeasures()
  performance.clearMarks()
}
