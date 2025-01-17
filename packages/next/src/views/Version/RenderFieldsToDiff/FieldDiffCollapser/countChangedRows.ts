import { hasChanges } from './hasChanges.js'

type Args = {
  comparison?: unknown
  version?: unknown
}

export function countChangedRows({ comparison, version }: Args) {
  let count = 0
  let i = 0
  while (comparison?.[i] || version?.[i]) {
    if (hasChanges(version?.[i], comparison?.[i])) {
      count++
    }
    i++
  }
  return count
}
