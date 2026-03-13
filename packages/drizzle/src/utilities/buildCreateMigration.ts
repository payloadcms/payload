import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'
import type { CreateMigration, MigrationCreateResult, Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter } from '../types.js'

import { getMigrationTemplate } from './getMigrationTemplate.js'

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
    { dryRun, file, forceAcceptWarning, fromStdin, migrationName, payload, skipEmpty },
  ): Promise<MigrationCreateResult> {
    const dir = payload.db.migrationDir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    // Handle --from-stdin: parse JSON from stdin, skip schema diff
    if (fromStdin) {
      if (file) {
        return {
          error: '--from-stdin and --file are mutually exclusive',
          hasChanges: false,
          status: 'error',
        }
      }

      if (dryRun) {
        return {
          error: '--from-stdin and --dry-run are mutually exclusive',
          hasChanges: false,
          status: 'error',
        }
      }

      if (!migrationName) {
        return {
          error: 'Migration name is required when using --from-stdin',
          hasChanges: false,
          status: 'error',
        }
      }

      let stdinData: { downSQL?: string; imports?: string; upSQL?: string }

      try {
        stdinData = JSON.parse(fromStdin)
      } catch {
        return {
          error: 'Invalid JSON provided via --from-stdin',
          hasChanges: false,
          status: 'error',
        }
      }

      if (!stdinData.upSQL) {
        return {
          error: 'Missing required "upSQL" field in --from-stdin JSON',
          hasChanges: false,
          status: 'error',
        }
      }

      const { generateDrizzleJson } = this.requireDrizzleKit()
      const drizzleJsonAfter = await generateDrizzleJson(this.schema)

      const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
      const formattedDate = yyymmdd.replace(/\D/g, '')
      const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')
      const timestamp = `${formattedDate}_${formattedTime}`
      const fileName = `${timestamp}_${migrationName.replace(/\W/g, '_')}`
      const filePath = `${dir}/${fileName}`

      // Write schema snapshot for future diffs
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))

      const data = getMigrationTemplate({
        downSQL: stdinData.downSQL || `  // Migration code`,
        imports: stdinData.imports || '',
        packageName: payload.db.packageName,
        upSQL: stdinData.upSQL,
      })

      const fullPath = `${filePath}.ts`
      fs.writeFileSync(fullPath, data)

      writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

      payload.logger.info({ msg: `Migration created at ${fullPath}` })

      return {
        downSQL: stdinData.downSQL,
        filePath: fullPath,
        hasChanges: true,
        migrationName: fileName,
        schemaPath: `${filePath}.json`,
        status: 'created',
        upSQL: stdinData.upSQL,
      }
    }

    const { generateDrizzleJson, generateMigration, upSnapshot } = this.requireDrizzleKit()

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

    if (this.schemaName) {
      drizzleJsonBefore.schemas = {
        [this.schemaName]: this.schemaName,
      }
    }

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
      const sqlStatementsUp = await generateMigration(drizzleJsonBefore, drizzleJsonAfter)

      payload.logger.info('Migration UP complete. Generating DOWN statements...')
      const sqlStatementsDown = await generateMigration(drizzleJsonAfter, drizzleJsonBefore)

      payload.logger.info('Migration DOWN statements generation complete.')

      const sqlExecute = `await db.${executeMethod}(` + 'sql`'

      if (sqlStatementsUp?.length) {
        upSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsUp })
      }
      if (sqlStatementsDown?.length) {
        downSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsDown })
      }

      if (!upSQL?.length && !downSQL?.length) {
        if (skipEmpty || forceAcceptWarning) {
          if (dryRun) {
            return { hasChanges: false, status: 'dry-run' }
          }

          if (!forceAcceptWarning) {
            return { hasChanges: false, status: 'no-changes' }
          }

          // forceAcceptWarning: fall through to create blank migration
        } else {
          const { confirm: shouldCreateBlankMigration } = await prompts(
            {
              name: 'confirm',
              type: 'confirm',
              initial: false,
              message:
                'No schema changes detected. Would you like to create a blank migration file?',
            },
            {
              onCancel: () => {
                process.exit(0)
              },
            },
          )

          if (!shouldCreateBlankMigration) {
            return { hasChanges: false, status: 'no-changes' }
          }
        }
      }

      // Dry-run: return generated SQL without writing files
      if (dryRun) {
        return {
          downSQL: downSQL || undefined,
          hasChanges: !!(upSQL?.length || downSQL?.length),
          status: 'dry-run',
          upSQL: upSQL || undefined,
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

    return {
      downSQL: downSQL || undefined,
      filePath: fullPath,
      hasChanges: !!(upSQL?.length || downSQL?.length),
      migrationName: fileName,
      schemaPath: `${filePath}.json`,
      status: 'created',
      upSQL: upSQL || undefined,
    }
  }
}
