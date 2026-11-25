import type { CreateMigration } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter, DrizzleMigrationResult, DrizzleSnapshotJSON } from '../types.js'

import { generateMigrationWithCreateHints } from './generateMigrationWithCreateHints.js'
import { getMigrationTemplate } from './getMigrationTemplate.js'
import { getMissingHints, invertMigrationHints } from './migrationHints.js'
import { readPreviousSchemaState } from './readPreviousSchemaState.js'

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

    const kit = await this.requireDrizzleKit()
    const { generateDrizzleJson, generateMigration } = kit

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

    if (!upSQL) {
      const drizzleJsonBefore =
        (await readPreviousSchemaState({ dir, kit, payload })) ??
        (this.defaultDrizzleSnapshot as DrizzleSnapshotJSON)

      payload.logger.info('Starting migration: generating UP statements...')

      const up = await generateUpMigration({
        after: drizzleJsonAfter,
        before: drizzleJsonBefore,
        forceAcceptWarning,
        generateMigration,
        shouldPrompt,
      })

      payload.logger.info('Migration UP complete. Generating DOWN statements...')

      // DOWN reverses the renames chosen for UP, so it never asks again.
      const down = await generateMigrationWithCreateHints({
        after: drizzleJsonBefore,
        before: drizzleJsonAfter,
        generateMigration,
        initialHints: invertMigrationHints({ hints: up.hints }),
      })

      const sqlStatementsUp = up.sqlStatements
      const sqlStatementsDown = down.sqlStatements

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

      // Postgres returns a delta snapshot to store; SQLite stores the full state.
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(up.snapshot ?? drizzleJsonAfter, null, 2))
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
 * Generates the UP migration. Interactive runs let drizzle-kit ask rename-or-create questions in
 * the terminal; `forceAcceptWarning` treats every ambiguous entity as newly created. Without a
 * terminal, drizzle-kit can't ask, so an ambiguous change fails with instructions.
 */
const generateUpMigration = async ({
  after,
  before,
  forceAcceptWarning,
  generateMigration,
  shouldPrompt,
}: {
  after: DrizzleSnapshotJSON
  before: DrizzleSnapshotJSON
  forceAcceptWarning?: boolean
  generateMigration: Parameters<typeof generateMigrationWithCreateHints>[0]['generateMigration']
  shouldPrompt: boolean
}): Promise<DrizzleMigrationResult> => {
  if (forceAcceptWarning) {
    return generateMigrationWithCreateHints({ after, before, generateMigration })
  }

  try {
    return await generateMigration(before, after, { interactive: shouldPrompt })
  } catch (error) {
    if (getMissingHints({ error })) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}\n\nRun migrate:create in an ` +
          `interactive terminal to answer these questions, or pass --force-accept-warning to ` +
          `create every ambiguous entity as new.`,
        { cause: error },
      )
    }

    throw error
  }
}
