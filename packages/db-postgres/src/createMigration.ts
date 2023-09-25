/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { DrizzleSnapshotJSON } from 'drizzle-kit/utils'
import type { CreateMigration } from 'payload/database'

import { generateDrizzleJson, generateMigration } from 'drizzle-kit/utils'
import fs from 'fs'

import type { PostgresAdapter } from './types'

const migrationTemplate = (upSQL?: string) => `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  ${upSQL ? `await payload.db.db.execute(\`${upSQL}\`);` : '// Migration code'}
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`

export const createMigration: CreateMigration = async function createMigration(
  this: PostgresAdapter,
  payload,
  migrationDir,
  migrationName,
) {
  payload.logger.info({ msg: 'Creating migration from postgres adapter...' })
  const dir = migrationDir || 'migrations'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd.replace(/\D/g, '')
  const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const formattedName = migrationName.replace(/\W/g, '_')
  const fileName = `${timestamp}_${formattedName}.ts`
  const filePath = `${dir}/${fileName}`

  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
    limit: 1,
    sort: '-name',
  })

  const drizzleJsonBefore = migrationQuery.docs[0]?.schema as DrizzleSnapshotJSON

  const drizzleJsonAfter = generateDrizzleJson(this.schema)
  const sqlStatements = await generateMigration(
    drizzleJsonBefore || {
      id: '00000000-0000-0000-0000-000000000000',
      _meta: {
        columns: {},
        schemas: {},
        tables: {},
      },
      dialect: 'pg',
      enums: {},
      prevId: '00000000-0000-0000-0000-000000000000',
      schemas: {},
      tables: {},
      version: '5',
    },
    drizzleJsonAfter,
  )

  fs.writeFileSync(
    filePath,
    migrationTemplate(sqlStatements.length ? sqlStatements?.join('\n') : undefined),
  )
}
