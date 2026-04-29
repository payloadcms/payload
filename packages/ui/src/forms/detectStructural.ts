export type StructuralEventKind = 'add' | 'remove' | 'reorder'

export type StructuralEvent = {
  kind: StructuralEventKind
  path: string
}

export function detectStructural(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): StructuralEvent[] {
  const events: StructuralEvent[] = []
  const keys = new Set<string>([...Object.keys(next), ...Object.keys(prev)])

  for (const key of keys) {
    const before = prev[key]
    const after = next[key]
    if (!Array.isArray(before) && !Array.isArray(after)) {
      continue
    }

    const prevArr = Array.isArray(before) ? before : []
    const nextArr = Array.isArray(after) ? after : []

    if (nextArr.length > prevArr.length) {
      for (let i = prevArr.length; i < nextArr.length; i++) {
        events.push({ kind: 'add', path: `${key}.${i}` })
      }
    } else if (nextArr.length < prevArr.length) {
      for (let i = nextArr.length; i < prevArr.length; i++) {
        events.push({ kind: 'remove', path: `${key}.${i}` })
      }
    } else if (!sameRowOrderingByIds(prevArr, nextArr)) {
      // Identical length but row identities reordered — design decision: do not
      // emit events. Reorders don't need a re-render of any individual row.
    }
  }

  return events
}

function sameRowOrderingByIds(prev: unknown[], next: unknown[]): boolean {
  const prevIds = collectIds(prev)
  const nextIds = collectIds(next)
  // If either side has missing ids, fall through (treat as same — caller already
  // handled length-mismatch cases above).
  if (prevIds.length !== prev.length || nextIds.length !== next.length) {
    return true
  }
  return prevIds.join(',') === nextIds.join(',')
}

function collectIds(arr: unknown[]): string[] {
  const ids: string[] = []
  for (const row of arr) {
    if (row && typeof row === 'object' && 'id' in row) {
      const id = (row as { id?: unknown }).id
      if (typeof id === 'string' || typeof id === 'number') {
        ids.push(String(id))
      }
    }
  }
  return ids
}
