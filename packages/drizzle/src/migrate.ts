import type { MigrateResult, Payload } from 'payload'

import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  readMigrationFiles,
} from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter, Migration } from './types.js'

import { getTransaction } from './utilities/getTransaction.js'
import { migrationTableExists } from './utilities/migrationTableExists.js'
import { parseError } from './utilities/parseError.js'

export const migrate: DrizzleAdapter['migrate'] = async function migrate(
  this: DrizzleAdapter,
  args,
): Promise<MigrateResult> {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }

  if ('createExtensions' in this && typeof this.createExtensions === 'function') {
    await this.createExtensions()
  }

  let latestBatch = 0
  let migrationsInDB = []

  const hasMigrationTable = await migrationTableExists(this)

  if (hasMigrationTable) {
    ;({ docs: migrationsInDB } = await payload.find({
      collection: 'payload-migrations',
      limit: 0,
      sort: '-name',
    }))

    if (migrationsInDB.find((m) => m.batch === -1)) {
      if (args?.forceAcceptWarning) {
        migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
      } else {
        const { confirm: runMigrations } = await prompts(
          {
            name: 'confirm',
            type: 'confirm',
            initial: false,
            message:
              "It looks like you've run Payload in dev mode, meaning you've dynamically pushed changes to your database.\n\n" +
              "If you'd like to run migrations, data loss will occur. Would you like to proceed?",
          },
          {
            onCancel: () => {
              process.exit(0)
            },
          },
        )

        if (!runMigrations) {
          process.exit(0)
        }
        migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
      }
    }

    if (Number(migrationsInDB?.[0]?.batch) > 0) {
      latestBatch = Number(migrationsInDB[0]?.batch)
    }
  }

  const newBatch = latestBatch + 1
  const migrationsRan: Array<{ durationMs: number; name: string }> = []

  const pendingMigrations = migrationFiles.filter(
    (migration) => !migrationsInDB.find((existing) => existing.name === migration.name),
  )

  if (args?.dryRun) {
    return {
      migrationsRan: [],
      pending: pendingMigrations.length,
      status: 'dry-run',
    }
  }

  if (!pendingMigrations.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }

  for (const migration of pendingMigrations) {
    const result = await runMigrationFile(payload, migration, newBatch)
    migrationsRan.push(result)
  }

  return { migrationsRan, pending: 0, status: 'completed' }
}

async function runMigrationFile(
  payload: Payload,
  migration: Migration,
  batch: number,
): Promise<{ durationMs: number; name: string }> {
  const start = Date.now()
  const req = await createLocalReq({}, payload)

  payload.logger.info({ msg: `Migrating: ${migration.name}` })

  try {
    await initTransaction(req)
    const db = await getTransaction(payload.db as DrizzleAdapter, req)
    await migration.up({ db, payload, req })
    const durationMs = Date.now() - start
    payload.logger.info({ msg: `Migrated:  ${migration.name} (${durationMs}ms)` })
    await payload.create({
      collection: 'payload-migrations',
      data: {
        name: migration.name,
        batch,
      },
      req,
    })
    await commitTransaction(req)
    return { name: migration.name, durationMs }
  } catch (err: unknown) {
    await killTransaction(req)
    const errorMsg = parseError(err, `Error running migration ${migration.name}`)
    payload.logger.error({
      err,
      msg: errorMsg,
    })
    throw new Error(errorMsg)
  }
}
