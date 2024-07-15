import type { CreateMigration, MigrationTemplateArgs } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration } from 'payload'
import { fileURLToPath } from 'url'

const migrationTemplate = ({ downSQL, imports, upSQL }: MigrationTemplateArgs): string => `import {
  MigrateUpArgs,
  MigrateDownArgs,
} from '@payloadcms/db-mongodb'
${imports}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
${upSQL ?? `  // Migration code`}
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
${downSQL ?? `  // Migration code`}
}
`

export const createMigration: CreateMigration = async function createMigration({
  file,
  migrationName,
  payload,
}) {
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

  const migrationFileContent = migrationTemplate(predefinedMigration)

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
