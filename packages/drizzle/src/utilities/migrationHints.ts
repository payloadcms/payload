import type { DrizzleMigrationHint } from '../types.js'

/**
 * A decision drizzle-kit could not make without a hint, from its `missing_hints` error. Entity ids
 * look like `['public', 'posts', 'title']`; SQLite uses `'public'` as the schema.
 */
export type DrizzleMissingHint = {
  entity: readonly string[]
  kind: string
  reason?: string
  type: 'confirm_data_loss' | 'rename_or_create'
}

/** Returns the unresolved decisions from a drizzle-kit `missing_hints` error. */
export const getMissingHints = ({
  error,
}: {
  error: unknown
}): DrizzleMissingHint[] | undefined => {
  if (
    !error ||
    typeof error !== 'object' ||
    !('code' in error) ||
    error.code !== 'missing_hints' ||
    !('missingHints' in error) ||
    !Array.isArray(error.missingHints)
  ) {
    return undefined
  }

  const isMissingHint = (hint: unknown): hint is DrizzleMissingHint =>
    !!hint &&
    typeof hint === 'object' &&
    'type' in hint &&
    (hint.type === 'rename_or_create' || hint.type === 'confirm_data_loss') &&
    'kind' in hint &&
    typeof hint.kind === 'string' &&
    'entity' in hint &&
    Array.isArray(hint.entity) &&
    hint.entity.every((part) => typeof part === 'string')

  return error.missingHints.every(isMissingHint) ? error.missingHints : undefined
}

/** Reverses the renames applied to an UP migration so its DOWN migration undoes them. */
export const invertMigrationHints = ({
  hints,
}: {
  hints: DrizzleMigrationHint[]
}): DrizzleMigrationHint[] =>
  hints.flatMap((hint): DrizzleMigrationHint[] =>
    hint.type === 'rename' ? [{ ...hint, from: hint.to, to: hint.from }] : [],
  )
