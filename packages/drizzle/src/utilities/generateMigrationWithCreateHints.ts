import type { DrizzleMigrationHint, DrizzleSnapshotJSON, RequireDrizzleKit } from '../types.js'

type MissingCreateHint = {
  entity: string[]
  kind: string
  type: 'rename_or_create'
}

/**
 * Predefined data migrations copy their data explicitly and create new schema entities rather than
 * renaming old ones. Resolve only that ambiguity; never accept data-loss confirmations here.
 */
export const generateMigrationWithCreateHints = async ({
  after,
  before,
  generateMigration,
}: {
  after: DrizzleSnapshotJSON
  before: DrizzleSnapshotJSON
  generateMigration: ReturnType<RequireDrizzleKit>['generateMigration']
}): Promise<string[]> => {
  const hints: DrizzleMigrationHint[] = []
  const resolvedHints = new Set<string>()

  while (true) {
    try {
      return await generateMigration(before, after, { hints: [...hints] })
    } catch (error) {
      const missingHints = getMissingCreateHints({ error })

      if (!missingHints?.length) {
        throw error
      }

      let hasNewHints = false

      for (const { entity, kind } of missingHints) {
        const key = JSON.stringify([kind, entity])

        if (!resolvedHints.has(key)) {
          hints.push({ type: 'create', entity, kind })
          resolvedHints.add(key)
          hasNewHints = true
        }
      }

      if (!hasNewHints) {
        throw error
      }
    }
  }
}

const getMissingCreateHints = ({ error }: { error: unknown }): MissingCreateHint[] | undefined => {
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

  const isCreateHint = (hint: unknown): hint is MissingCreateHint =>
    !!hint &&
    typeof hint === 'object' &&
    'type' in hint &&
    hint.type === 'rename_or_create' &&
    'kind' in hint &&
    typeof hint.kind === 'string' &&
    'entity' in hint &&
    Array.isArray(hint.entity) &&
    hint.entity.every((part) => typeof part === 'string')

  return error.missingHints.every(isCreateHint) ? error.missingHints : undefined
}
