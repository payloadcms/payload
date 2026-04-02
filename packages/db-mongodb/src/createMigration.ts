import type { CreateMigration, MigrationTemplateArgs } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import { fileURLToPath } from 'url'

const migrationTemplate = ({ downSQL, imports, upSQL }: MigrationTemplateArgs): string => `import {
  MigrateDownArgs,
  MigrateUpArgs,
} from '@payloadcms/db-mongodb'
${imports ?? ''}
export async function up({ payload, req, session }: MigrateUpArgs): Promise<void> {
${upSQL ?? `  // Migration code`}
}

export async function down({ payload, req, session }: MigrateDownArgs): Promise<void> {
${downSQL ?? `  // Migration code`}
}
`

export const createMigration: CreateMigration = async function createMigration({
  file,
  migrationName,
  payload,
  skipEmpty,
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

  const formattedDate = yyymmdd!.replace(/\D/g, '')
  const formattedTime = hhmmss!.split('.')[0]!.replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const formattedName = migrationName?.replace(/\W/g, '_')
  const fileName = migrationName ? `${timestamp}_${formattedName}.ts` : `${timestamp}_migration.ts`
  const filePath = `${dir}/${fileName}`

  if (!skipEmpty) {
    fs.writeFileSync(filePath, migrationFileContent)
  }

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}` })
}
