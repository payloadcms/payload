/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { CreateMigration } from 'payload/database'

import fs from 'fs'
import path from 'path'

const migrationTemplate = (upSQL?: string, downSQL?: string) => `import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
${upSQL ?? `  // Migration code`}
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
${downSQL ?? `  // Migration code`}
};
`

export const createMigration: CreateMigration = async function createMigration({
  file,
  migrationName,
  payload,
}) {
  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  let migrationFileContent: string | undefined

  // Check for predefined migration.
  // Either passed in via --file or prefixed with @payloadcms/db-mongodb/
  if (file || migrationName?.startsWith('@payloadcms/db-mongodb/')) {
    if (!file) file = migrationName

    const predefinedMigrationName = file.replace('@payloadcms/db-mongodb/', '')
    migrationName = predefinedMigrationName
    const cleanPath = path.join(__dirname, `../predefinedMigrations/${predefinedMigrationName}.js`)

    // Check if predefined migration exists
    if (fs.existsSync(cleanPath)) {
      const { down, up } = require(cleanPath)
      migrationFileContent = migrationTemplate(up, down)
    } else {
      payload.logger.error({
        msg: `Canned migration ${predefinedMigrationName} not found.`,
      })
      process.exit(1)
    }
  } else {
    migrationFileContent = migrationTemplate()
  }

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd.replace(/\D/g, '')
  const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const formattedName = migrationName?.replace(/\W/g, '_')
  const fileName = migrationName ? `${timestamp}_${formattedName}.ts` : `${timestamp}_migration.ts`
  const filePath = `${dir}/${fileName}`
  fs.writeFileSync(filePath, migrationFileContent)
  payload.logger.info({ msg: `Migration created at ${filePath}` })
}
