import type { CreateMigration } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter, DrizzleMigrationHint, DrizzleSnapshotJSON } from '../types.js'
import type { ChooseRenameSource, ConfirmDataLoss } from './resolveMigrationHints.js'

import { getMigrationTemplate } from './getMigrationTemplate.js'
import {
  getDroppedSnapshotEntities,
  invertMigrationHints,
  promptDataLoss,
  promptRenameSource,
  resolveMigrationHints,
} from './resolveMigrationHints.js'

export const buildCreateMigration = ({
  executeMethod,
  filename,
  sanitizeStatements,
}: {
  executeMethod: string
  filename: string
  sanitizeStatements: (args: { sqlExecute: string; statements: string[] }) => string
}): CreateMigration => {
  const dirname = path.dirname(filename)
  return async function createMigration(
    this: DrizzleAdapter,
    { file, forceAcceptWarning, migrationName, payload, shouldPrompt = true, skipEmpty },
  ) {
    const dir = payload.db.migrationDir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const { generateDrizzleJson, generateMigration, upSnapshot } = await this.requireDrizzleKit()

    const drizzleJsonAfter = await generateDrizzleJson(this.schema)

    const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
    const formattedDate = yyymmdd.replace(/\D/g, '')
    const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')
    let imports: string = ''
    let downSQL: string
    let upSQL: string

    const predefinedMigration = await getPredefinedMigration({
      dirname,
      file,
      migrationName,
      payload,
    })

    imports = predefinedMigration.imports
    downSQL = predefinedMigration.downSQL
    upSQL = predefinedMigration.upSQL

    const timestamp = `${formattedDate}_${formattedTime}`

    const name = migrationName || file?.split('/').slice(2).join('/')
    const fileName = `${timestamp}${name ? `_${name.replace(/\W/g, '_')}` : ''}`

    const filePath = `${dir}/${fileName}`

    if (typeof predefinedMigration.dynamic === 'function') {
      const dynamicResult = await predefinedMigration.dynamic({ filePath, payload })

      if (dynamicResult.upSQL) {
        upSQL = dynamicResult.upSQL
      }

      if (dynamicResult.downSQL) {
        downSQL = dynamicResult.downSQL
      }

      if (dynamicResult.imports) {
        imports = dynamicResult.imports
      }
    }

    let drizzleJsonBefore = this.defaultDrizzleSnapshot as DrizzleSnapshotJSON

    if (!upSQL) {
      // Get latest migration snapshot
      const latestSnapshot = fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.json'))
        .sort()
        .reverse()?.[0]

      if (latestSnapshot) {
        drizzleJsonBefore = JSON.parse(fs.readFileSync(`${dir}/${latestSnapshot}`, 'utf8'))

        if (upSnapshot && drizzleJsonBefore.version < drizzleJsonAfter.version) {
          drizzleJsonBefore = upSnapshot(drizzleJsonBefore)
        }
      }

      payload.logger.info('Starting migration: generating UP statements...')
      let upHints: DrizzleMigrationHint[] = []

      const sqlStatementsUp = await resolveMigrationHints({
        ...getHintDecisionHandlers({ forceAcceptWarning, shouldPrompt }),
        getDroppedEntities: () =>
          getDroppedSnapshotEntities({ after: drizzleJsonAfter, before: drizzleJsonBefore }),
        run: (hints) => {
          upHints = hints
          return generateMigration(drizzleJsonBefore, drizzleJsonAfter, { hints })
        },
      })

      payload.logger.info('Migration UP complete. Generating DOWN statements...')
      // DOWN reverses the renames chosen for UP; everything else it re-creates or drops.
      const sqlStatementsDown = await resolveMigrationHints({
        chooseRenameSource: () => Promise.resolve(null),
        confirmDataLoss: () => Promise.resolve(true),
        getDroppedEntities: () => [],
        initialHints: invertMigrationHints({ hints: upHints }),
        run: (hints) => generateMigration(drizzleJsonAfter, drizzleJsonBefore, { hints }),
      })

      payload.logger.info('Migration DOWN statements generation complete.')

      const sqlExecute = `await db.${executeMethod}(` + 'sql`'

      if (sqlStatementsUp?.length) {
        upSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsUp })
      }
      if (sqlStatementsDown?.length) {
        downSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsDown })
      }

      if (!upSQL?.length && !downSQL?.length && !forceAcceptWarning) {
        if (skipEmpty || !shouldPrompt) {
          return { created: false }
        }

        const { confirm: shouldCreateBlankMigration } = await prompts({
          name: 'confirm',
          type: 'confirm',
          initial: false,
          message: 'No schema changes detected. Would you like to create a blank migration file?',
        })

        if (!shouldCreateBlankMigration) {
          return { created: false }
        }
      }

      // write schema
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))
    }

    const data = getMigrationTemplate({
      downSQL: downSQL || `  // Migration code`,
      imports,
      packageName: payload.db.packageName,
      upSQL: upSQL || `  // Migration code`,
    })

    const fullPath = `${filePath}.ts`

    // write migration
    fs.writeFileSync(fullPath, data)

    writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

    payload.logger.info({ msg: `Migration created at ${fullPath}` })

    return { created: true, path: fullPath }
  }
}

/**
 * Decides how ambiguous renames and data-loss changes are resolved: `forceAcceptWarning` creates
 * every ambiguous entity and accepts data loss, interactive runs prompt, and anything else leaves
 * the handlers unset so the migration fails with an explanatory error.
 */
const getHintDecisionHandlers = ({
  forceAcceptWarning,
  shouldPrompt,
}: {
  forceAcceptWarning?: boolean
  shouldPrompt: boolean
}): { chooseRenameSource?: ChooseRenameSource; confirmDataLoss?: ConfirmDataLoss } => {
  if (forceAcceptWarning) {
    return {
      chooseRenameSource: () => Promise.resolve(null),
      confirmDataLoss: () => Promise.resolve(true),
    }
  }

  if (shouldPrompt) {
    return { chooseRenameSource: promptRenameSource, confirmDataLoss: promptDataLoss }
  }

  return {}
}
