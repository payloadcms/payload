import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'
import type { CreateMigration } from 'payload'

import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import prompts from 'prompts'
import { fileURLToPath } from 'url'

import type { SQLiteAdapter } from './types.js'

import { defaultDrizzleSnapshot } from './defaultSnapshot.js'
import { getMigrationTemplate } from './getMigrationTemplate.js'

const require = createRequire(import.meta.url)

export const createMigration: CreateMigration = async function createMigration(
  this: SQLiteAdapter,
  { file, migrationName, payload, skipEmpty },
) {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  const { generateSQLiteDrizzleJson, generateSQLiteMigration } = require('drizzle-kit/api')
  const drizzleJsonAfter = await generateSQLiteDrizzleJson(this.schema)
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

  let drizzleJsonBefore = defaultDrizzleSnapshot as any

  if (!upSQL) {
    // Get latest migration snapshot
    const latestSnapshot = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .reverse()?.[0]

    if (latestSnapshot) {
      drizzleJsonBefore = JSON.parse(
        fs.readFileSync(`${dir}/${latestSnapshot}`, 'utf8'),
      ) as DrizzleSnapshotJSON
    }

    const sqlStatementsUp = await generateSQLiteMigration(drizzleJsonBefore, drizzleJsonAfter)
    const sqlStatementsDown = await generateSQLiteMigration(drizzleJsonAfter, drizzleJsonBefore)
    // need to create tables as separate statements
    const sqlExecute = 'await payload.db.drizzle.run(sql`'

    if (sqlStatementsUp?.length) {
      upSQL = sqlStatementsUp
        .map((statement) => `${sqlExecute}${statement?.replaceAll('`', '\\`')}\`)`)
        .join('\n')
    }
    if (sqlStatementsDown?.length) {
      downSQL = sqlStatementsDown
        .map((statement) => `${sqlExecute}${statement?.replaceAll('`', '\\`')}\`)`)
        .join('\n')
    }

    if (!upSQL?.length && !downSQL?.length) {
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
      upSQL: upSQL || `  // Migration code`,
    }),
  )

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}.ts` })
}
