/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { Payload } from 'payload'
import type { Migration } from 'payload/database'
import type { PayloadRequest } from 'payload/dist/express/types'

import { readMigrationFiles } from 'payload/database'
import { commitTransaction } from 'payload/dist/utilities/commitTransaction'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import prompts from 'prompts'

import type { PostgresAdapter } from './types'

import { createMigrationTable } from './utilities/createMigrationTable'
import { migrationTableExists } from './utilities/migrationTableExists'
import { parseError } from './utilities/parseError'

export async function migrate(this: PostgresAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return
  }

  let latestBatch = 0
  let migrationsInDB = []

  const hasMigrationTable = await migrationTableExists(this.drizzle)

  if (hasMigrationTable) {
    ;({ docs: migrationsInDB } = await payload.find({
      collection: 'payload-migrations',
      limit: 0,
      sort: '-name',
    }))
    if (Number(migrationsInDB?.[0]?.batch) > 0) {
      latestBatch = Number(migrationsInDB[0]?.batch)
    }
  } else {
    await createMigrationTable(this)
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
      continue // eslint-disable-line no-continue
    }

    await runMigrationFile(payload, migration, newBatch)
  }
}

async function runMigrationFile(payload: Payload, migration: Migration, batch: number) {
  const { generateDrizzleJson } = require('drizzle-kit/payload')

  const start = Date.now()
  const req = { payload } as PayloadRequest

  payload.logger.info({ msg: `Migrating: ${migration.name}` })

  const pgAdapter = payload.db
  const drizzleJSON = generateDrizzleJson(pgAdapter.schema)

  try {
    await initTransaction(req)
    await migration.up({ payload, req })
    payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    await payload.create({
      collection: 'payload-migrations',
      data: {
        name: migration.name,
        batch,
        schema: drizzleJSON,
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
    throw err
  }
}
