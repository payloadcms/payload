import fs from 'fs'

import type { CreateMigration, MigrationCreateResult } from '../types.js'

import { writeMigrationIndex } from '../../index.js'
import { migrationTemplate } from './migrationTemplate.js'

export const createMigration: CreateMigration = function createMigration({
  dryRun,
  fromStdin,
  migrationName,
  payload,
}): Promise<MigrationCreateResult> {
  // MongoDB has no schema diffs — dry-run always reports no changes
  if (dryRun) {
    return Promise.resolve({ hasChanges: false, status: 'dry-run' })
  }

  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd!.replace(/\D/g, '')
  const formattedTime = hhmmss!.split('.')[0]!.replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const formattedName = migrationName!.replace(/\W/g, '_')
  const fileName = `${timestamp}_${formattedName}`
  const filePath = `${dir}/${fileName}.ts`

  let migrationContent = migrationTemplate

  // Handle --from-stdin for MongoDB: use provided content instead of blank template
  if (fromStdin) {
    try {
      const stdinData = JSON.parse(fromStdin)
      if (!stdinData.upSQL) {
        return Promise.resolve({
          error: 'Missing required "upSQL" field in --from-stdin JSON',
          hasChanges: false,
          status: 'error',
        })
      }
      migrationContent = migrationTemplate.replace('// Migration code', stdinData.upSQL)
    } catch {
      return Promise.resolve({
        error: 'Invalid JSON provided via --from-stdin',
        hasChanges: false,
        status: 'error',
      })
    }
  }

  fs.writeFileSync(filePath, migrationContent)

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}` })

  return Promise.resolve({
    filePath,
    hasChanges: false,
    migrationName: fileName,
    status: 'created',
  })
}
