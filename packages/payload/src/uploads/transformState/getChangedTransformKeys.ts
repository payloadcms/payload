import { isDeepStrictEqual } from 'node:util'

/** The `_transforms` keys that were added, removed or changed between two values. */
export function getChangedTransformKeys({
  next,
  previous,
}: {
  next: null | Record<string, unknown> | undefined
  previous: null | Record<string, unknown> | undefined
}): string[] {
  const keys = new Set([...Object.keys(next ?? {}), ...Object.keys(previous ?? {})])

  return [...keys].filter((key) => !isDeepStrictEqual(previous?.[key], next?.[key]))
}
