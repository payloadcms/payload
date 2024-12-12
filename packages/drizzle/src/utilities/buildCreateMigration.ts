import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'
import type { CreateMigration } from 'payload'

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
    { file, forceAcceptWarning, migrationName, payload, skipEmpty },
  ) {
    const dir = payload.db.migrationDir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const { generateDrizzleJson, generateMigration, upSnapshot } = this.requireDrizzleKit()

    const drizzleJsonAfter = await generateDrizzleJson(this.schema)

    const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
    const formattedDate = yyymmdd.replace(/\D/g, '')
    const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')
    let imports: string = ''
    let downSQL: string
    let upSQL: string
    ;({ downSQL, imports, upSQL } = await getPredefinedMigration({
      dirname,
      file,
      migrationName,
      payload,
    }))

    const timestamp = `${formattedDate}_${formattedTime}`

    const name = migrationName || file?.split('/').slice(2).join('/')
    const fileName = `${timestamp}${name ? `_${name.replace(/\W/g, '_')}` : ''}`

    const filePath = `${dir}/${fileName}`

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

      const sqlStatementsUp = await generateMigration(drizzleJsonBefore, drizzleJsonAfter)
      const sqlStatementsDown = await generateMigration(drizzleJsonAfter, drizzleJsonBefore)
      const sqlExecute = `await db.${executeMethod}(` + 'sql`'

      if (sqlStatementsUp?.length) {
        upSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsUp })
      }
      if (sqlStatementsDown?.length) {
        downSQL = sanitizeStatements({ sqlExecute, statements: sqlStatementsDown })
      }

      if (!upSQL?.length && !downSQL?.length && !forceAcceptWarning) {
        if (skipEmpty) {
          process.exit(0)
        }

        const { confirm: shouldCreateBlankMigration } = await prompts(
          {
            name: 'confirm',
            type: 'confirm',
            initial: false,
            message: 'No schema changes detected. Would you like to create a blank migration file?',
          },
          {
            onCancel: () => {
              process.exit(0)
            },
          },
        )

        if (!shouldCreateBlankMigration) {
          process.exit(0)
        }
      }

      // write schema
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))
    }

    // write migration
    fs.writeFileSync(
      `${filePath}.ts`,
      getMigrationTemplate({
        downSQL: downSQL || `  // Migration code`,
        imports,
        packageName: payload.db.packageName,
        upSQL: upSQL || `  // Migration code`,
      }),
    )

    writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

    payload.logger.info({ msg: `Migration created at ${filePath}.ts` })
  }
}
