import type {
  DrizzleMigrationHint,
  DrizzleMigrationResult,
  DrizzleSnapshotJSON,
  RequireDrizzleKit,
} from '../types.js'

import { getMissingHints } from './migrationHints.js'

/**
 * Generates a migration without prompting, treating every ambiguous entity as newly created.
 * Predefined data migrations copy their data explicitly, and DOWN migrations start from the
 * renames reversed from UP (`initialHints`), so creating is the right answer for everything left.
 * Data-loss confirmations are never accepted here.
 */
export const generateMigrationWithCreateHints = async ({
  after,
  before,
  generateMigration,
  initialHints = [],
}: {
  after: DrizzleSnapshotJSON
  before: DrizzleSnapshotJSON
  generateMigration: Awaited<ReturnType<RequireDrizzleKit>>['generateMigration']
  initialHints?: DrizzleMigrationHint[]
}): Promise<DrizzleMigrationResult> => {
  const hints: DrizzleMigrationHint[] = [...initialHints]
  const resolvedHints = new Set<string>()

  while (true) {
    try {
      return await generateMigration(before, after, { hints: [...hints] })
    } catch (error) {
      const missingHints = getMissingHints({ error })

      if (!missingHints?.length || missingHints.some(({ type }) => type !== 'rename_or_create')) {
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
