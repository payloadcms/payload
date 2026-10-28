import type { UploadTransformer } from '../transformers/types.js'

import { isFocalPointKey } from './focalPoint.js'

/**
 * Checks that every saved `_transforms` key is claimed by exactly one stage that will run, so a
 * rebuild never saves a key that nothing applies or that two stages apply.
 */
export function getTransformKeyCoverageErrors({
  claims,
  transforms,
}: {
  /** The stages that will run, each with the keys it claims. */
  claims: Map<UploadTransformer, string[]>
  transforms: null | Record<string, unknown> | undefined
}): { message: string; path: string }[] {
  const errors: { message: string; path: string }[] = []

  for (const key of Object.keys(transforms ?? {})) {
    const claimers = [...claims].filter(([, keys]) => keys.includes(key))

    if (claimers.length === 0 && !isFocalPointKey(key)) {
      errors.push({
        message: 'No configured transformer applies this key.',
        path: `_transforms.${key}`,
      })
    }

    if (claimers.length > 1) {
      errors.push({
        message: `More than one transformer applies this key: ${claimers.map(([transformer]) => `"${transformer.slug}"`).join(', ')}.`,
        path: `_transforms.${key}`,
      })
    }
  }

  return errors
}
