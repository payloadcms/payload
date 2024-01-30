/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type { CreateMigration } from 'payload/database'

import fs from 'fs'
import prompts from 'prompts'

import type { PostgresAdapter } from './types'

const migrationTemplate = (
  upSQL?: string,
  downSQL?: string,
) => `import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

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
  { forceAcceptWarning, migrationName, payload },
) {
  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

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
      sqlStatementsUp.length ? sqlStatementsUp?.join('\n') : undefined,
      sqlStatementsDown.length ? sqlStatementsDown?.join('\n') : undefined,
    ),
  )
  payload.logger.info({ msg: `Migration created at ${filePath}.ts` })
}
