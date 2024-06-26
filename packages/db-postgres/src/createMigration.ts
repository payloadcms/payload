/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type { CreateMigration, MigrationTemplateArgs } from 'payload'

import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { getPredefinedMigration } from 'payload'
import prompts from 'prompts'
import { fileURLToPath } from 'url'

import type { PostgresAdapter } from './types.js'

const require = createRequire(import.meta.url)

const migrationTemplate = ({
  downSQL,
  imports,
  upSQL,
}: MigrationTemplateArgs): string => `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
${imports ? `${imports}\n` : ''}
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
${upSQL}
};

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
${downSQL}
};
`

const getDefaultDrizzleSnapshot = (): DrizzleSnapshotJSON => ({
  id: '00000000-0000-0000-0000-000000000000',
  _meta: {
    columns: {},
    schemas: {},
    tables: {},
  },
  dialect: 'pg',
  enums: {},
  prevId: '00000000-0000-0000-0000-00000000000',
  schemas: {},
  tables: {},
  version: '5',
})

export const createMigration: CreateMigration = async function createMigration(
  this: PostgresAdapter,
  { file, forceAcceptWarning, migrationName, payload },
) {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  const { generateDrizzleJson, generateMigration } = require('drizzle-kit/payload')
  const drizzleJsonAfter = generateDrizzleJson(this.schema)
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

  let drizzleJsonBefore = getDefaultDrizzleSnapshot()

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

    const sqlStatementsUp = await generateMigration(drizzleJsonBefore, drizzleJsonAfter)
    const sqlStatementsDown = await generateMigration(drizzleJsonAfter, drizzleJsonBefore)
    const sqlExecute = 'await payload.db.drizzle.execute(sql`'

    if (sqlStatementsUp?.length) {
      upSQL = `${sqlExecute}\n ${sqlStatementsUp?.join('\n')}\`)`
    }
    if (sqlStatementsDown?.length) {
      downSQL = `${sqlExecute}\n ${sqlStatementsDown?.join('\n')}\`)`
    }

    if (!upSQL?.length && !downSQL?.length && !forceAcceptWarning) {
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
  }

  // write schema
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))

  // write migration
  fs.writeFileSync(
    `${filePath}.ts`,
    migrationTemplate({
      downSQL: downSQL || `  // Migration code`,
      imports,
      upSQL: upSQL || `  // Migration code`,
    }),
  )
  payload.logger.info({ msg: `Migration created at ${filePath}.ts` })
}
