/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type { CreateMigration, MigrationTemplateArgs } from 'payload/database'

import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { getPredefinedMigration } from 'payload/database'
import prompts from 'prompts'
import { fileURLToPath } from 'url'

import type { PostgresAdapter } from './types.js'

const require = createRequire(import.meta.url)

const migrationTemplate = ({
  downSQL,
  imports,
  upSQL,
}: MigrationTemplateArgs): string => `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
${imports}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
${
  upSQL
    ? `await payload.db.drizzle.execute(sql\`

${upSQL}\`);
`
    : '// Migration code'
}
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
${
  downSQL
    ? `await payload.db.drizzle.execute(sql\`

${downSQL}\`);
`
    : '// Migration code'
}
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

  const predefinedMigration = await getPredefinedMigration({
    dirname,
    file,
    migrationName,
    payload,
  })

  const { generateDrizzleJson, generateMigration } = require('drizzle-kit/payload')

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd.replace(/\D/g, '')
  const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const fileName = migrationName
    ? `${timestamp}_${migrationName.replace(/\W/g, '_')}`
    : `${timestamp}`

  const filePath = `${dir}/${fileName}`

  let drizzleJsonBefore = getDefaultDrizzleSnapshot()

  // Get latest migration snapshot
  const latestSnapshot = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()?.[0]

  if (latestSnapshot) {
    const latestSnapshotJSON = JSON.parse(
      fs.readFileSync(`${dir}/${latestSnapshot}`, 'utf8'),
    ) as DrizzleSnapshotJSON

    drizzleJsonBefore = latestSnapshotJSON
  }

  const drizzleJsonAfter = generateDrizzleJson(this.schema)
  const sqlStatementsUp = await generateMigration(drizzleJsonBefore, drizzleJsonAfter)
  const sqlStatementsDown = await generateMigration(drizzleJsonAfter, drizzleJsonBefore)

  if (!sqlStatementsUp.length && !sqlStatementsDown.length && !forceAcceptWarning) {
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

  // write migration
  fs.writeFileSync(
    `${filePath}.ts`,
    migrationTemplate(
      predefinedMigration
        ? predefinedMigration
        : {
            downSQL: sqlStatementsDown.length ? sqlStatementsDown?.join('\n') : undefined,
            upSQL: sqlStatementsUp.length ? sqlStatementsUp?.join('\n') : undefined,
          },
    ),
  )
  payload.logger.info({ msg: `Migration created at ${filePath}.ts` })
}
