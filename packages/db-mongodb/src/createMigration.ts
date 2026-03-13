import type { CreateMigration, MigrationCreateResult, MigrationTemplateArgs } from 'payload'

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
  dryRun,
  file,
  fromStdin,
  migrationName,
  payload,
  skipEmpty,
}): Promise<MigrationCreateResult> {
  // MongoDB has no schema diffs — dry-run always reports no changes
  if (dryRun) {
    return { hasChanges: false, status: 'dry-run' }
  }

  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)

  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  // Handle --from-stdin: parse JSON from stdin, use as migration content
  if (fromStdin) {
    if (file) {
      return {
        error: '--from-stdin and --file are mutually exclusive',
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

    const migrationFileContent = migrationTemplate({
      downSQL: stdinData.downSQL,
      imports: stdinData.imports,
      upSQL: stdinData.upSQL,
    })

    const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
    const formattedDate = yyymmdd!.replace(/\D/g, '')
    const formattedTime = hhmmss!.split('.')[0]!.replace(/\D/g, '')
    const timestamp = `${formattedDate}_${formattedTime}`
    const formattedName = migrationName?.replace(/\W/g, '_')
    const fileNameStr = `${timestamp}_${formattedName}`
    const filePath = `${dir}/${fileNameStr}.ts`

    fs.writeFileSync(filePath, migrationFileContent)
    writeMigrationIndex({ migrationsDir: payload.db.migrationDir })
    payload.logger.info({ msg: `Migration created at ${filePath}` })

    return {
      filePath,
      hasChanges: false,
      migrationName: fileNameStr,
      status: 'created',
    }
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
  const fileNameStr = migrationName ? `${timestamp}_${formattedName}` : `${timestamp}_migration`
  const filePath = `${dir}/${fileNameStr}.ts`

  if (!skipEmpty) {
    fs.writeFileSync(filePath, migrationFileContent)
  }

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}` })

  return {
    filePath,
    hasChanges: false,
    migrationName: fileNameStr,
    status: 'created',
  }
}
