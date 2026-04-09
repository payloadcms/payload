import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Connect, Migration } from 'payload'

import { Pool as NeonPool } from '@neondatabase/serverless'
import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { withReplicas } from 'drizzle-orm/pg-core'
import pg from 'pg'

import type { VercelPostgresAdapter } from './types.js'

export const connect: Connect = async function connect(
  this: VercelPostgresAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  try {
    const logger = this.logger || false

    const connectionString = this.poolOptions?.connectionString ?? process.env.POSTGRES_URL

    // Use non-vercel postgres for local database
    const useLocalPg =
      !this.forceUseVercelPostgres &&
      connectionString &&
      ['127.0.0.1', 'localhost'].includes(new URL(connectionString).hostname)

    if (useLocalPg) {
      const client = new pg.Pool(
        this.poolOptions ?? {
          connectionString,
        },
      )
      this.drizzle = drizzlePg({ client, logger, schema: this.schema })
    } else {
      const client = new NeonPool(this.poolOptions ?? { connectionString })
      this.drizzle = drizzleNeon({ client, logger, schema: this.schema })
    }

    if (this.readReplicaOptions) {
      this.primaryDrizzle = this.drizzle as any
      const readReplicas = this.readReplicaOptions.map((connectionString) => {
        const options = {
          ...this.poolOptions,
          connectionString,
        }
        if (useLocalPg) {
          const pool = new pg.Pool(options)
          return drizzlePg({ client: pool, logger, schema: this.schema })
        }
        const pool = new NeonPool(options)
        return drizzleNeon({ client: pool, logger, schema: this.schema })
      })
      const myReplicas = withReplicas(this.drizzle, readReplicas as any)
      this.drizzle = myReplicas
    }

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.message?.match(/database .* does not exist/i) && !this.disableCreateDatabase) {
      // capitalize first char of the err msg
      this.payload.logger.info(
        `${err.message.charAt(0).toUpperCase() + err.message.slice(1)}, creating...`,
      )
      const isCreated = await this.createDatabase()

      if (isCreated) {
        await this.connect?.(options)
        return
      }
    } else {
      this.payload.logger.error({
        err,
        msg: `Error: cannot connect to Postgres. Details: ${err.message}`,
      })
    }

    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    throw new Error(`Error: cannot connect to Postgres: ${err.message}`)
  }

  await this.createExtensions()

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_MIGRATING !== 'true' &&
    this.push !== false
  ) {
    await pushDevSchema(this as unknown as DrizzleAdapter)
  }

  if (typeof this.resolveInitializing === 'function') {
    this.resolveInitializing()
  }

  if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations as Migration[] })
  }
}
