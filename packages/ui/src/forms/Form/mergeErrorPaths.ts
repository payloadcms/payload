'use client'
import { arraysHaveSameStrings } from '../../utilities/arraysHaveSameStrings.js'

export const mergeErrorPaths = (
  existing?: string[],
  incoming?: string[],
): {
  changed: boolean
  result?: string[]
} => {
  if (!existing) {
    return {
      changed: false,
      result: undefined,
    }
  }

  const existingErrorPaths: string[] = []
  const incomingErrorPaths: string[] = []

  if (Array.isArray(incoming) && incoming?.length) {
    incoming.forEach((path) => incomingErrorPaths.push(path))
  }

  if (Array.isArray(existing) && existing?.length) {
    existing.forEach((path) => existingErrorPaths.push(path))
  }

  if (!arraysHaveSameStrings(existingErrorPaths, incomingErrorPaths)) {
    return {
      changed: true,
      result: incomingErrorPaths,
    }
  }
  return {
    changed: false,
    result: existing,
  }
}
