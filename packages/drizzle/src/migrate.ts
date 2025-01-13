import type { Payload } from 'payload'

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
): Promise<void> {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return
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
    if (Number(migrationsInDB?.[0]?.batch) > 0) {
      latestBatch = Number(migrationsInDB[0]?.batch)
    }
  }

  if (migrationsInDB.find((m) => m.batch === -1)) {
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
  }

  const newBatch = latestBatch + 1

  // Execute 'up' function for each migration sequentially
  for (const migration of migrationFiles) {
    const alreadyRan = migrationsInDB.find((existing) => existing.name === migration.name)

    // If already ran, skip
    if (alreadyRan) {
      continue
    }

    await runMigrationFile(payload, migration, newBatch)
  }
}

async function runMigrationFile(payload: Payload, migration: Migration, batch: number) {
  const start = Date.now()
  const req = await createLocalReq({}, payload)

  payload.logger.info({ msg: `Migrating: ${migration.name}` })

  try {
    await initTransaction(req)
    const db = await getTransaction(payload.db as DrizzleAdapter, req)
    await migration.up({ db, payload, req })
    payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    await payload.create({
      collection: 'payload-migrations',
      data: {
        name: migration.name,
        batch,
      },
      req,
    })
    await commitTransaction(req)
  } catch (err: unknown) {
    await killTransaction(req)
    payload.logger.error({
      err,
      msg: parseError(err, `Error running migration ${migration.name}`),
    })
    process.exit(1)
  }
}
