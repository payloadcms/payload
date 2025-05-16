// @ts-strict-ignore
import fs from 'fs'

import type { CreateMigration } from '../types.js'

import { writeMigrationIndex } from '../../index.js'
import { migrationTemplate } from './migrationTemplate.js'

export const createMigration: CreateMigration = function createMigration({
  migrationName,
  payload,
}) {
  const dir = payload.db.migrationDir
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
  fs.writeFileSync(filePath, migrationTemplate)

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}` })
}
