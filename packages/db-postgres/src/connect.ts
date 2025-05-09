import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Connect, Migration, Payload } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { withReplicas } from 'drizzle-orm/pg-core'

import type { PostgresAdapter } from './types.js'

const connectWithReconnect = async function ({
  adapter,
  pool,
  reconnect = false,
}: {
  adapter: PostgresAdapter
  pool: PostgresAdapter['pool']
  reconnect?: boolean
}) {
  let result

  if (!reconnect) {
    result = await pool.connect()
  } else {
    try {
      result = await pool.connect()
    } catch (ignore) {
      setTimeout(() => {
        adapter.payload.logger.info('Reconnecting to postgres')
        void connectWithReconnect({ adapter, pool, reconnect: true })
      }, 1000)
    }
  }
  if (!result) {
    return
  }
  result.prependListener('error', (err) => {
    try {
      if (err.code === 'ECONNRESET') {
        void connectWithReconnect({ adapter, pool, reconnect: true })
      }
    } catch (ignore) {
      // swallow error
    }
  })
}

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  try {
    if (!this.pool) {
      this.pool = new this.pg.Pool(this.poolOptions)
      await connectWithReconnect({ adapter: this, pool: this.pool })
    }

    // read replicas docs: https://orm.drizzle.team/docs/read-replicas
    // const primaryDb = drizzle("postgres://user:password@host:port/primary_db");
    // const read1 = drizzle("postgres://user:password@host:port/read_replica_1");
    // const read2 = drizzle("postgres://user:password@host:port/read_replica_2");
    // const db = withReplicas(primaryDb, [read1, read2]);

    // AI recommendation
    // import { Pool } from "pg";
    // import { drizzle } from "drizzle-orm/node-postgres";
    // import { withReplicas } from 'drizzle-orm/pg-core';
    //
    // // Create pool connections for each database
    // const primaryPool = new Pool({ connectionString: "postgres://user:password@host:port/primary_db" });
    // const read1Pool = new Pool({ connectionString: "postgres://user:password@host:port/read_replica_1" });
    // const read2Pool = new Pool({ connectionString: "postgres://user:password@host:port/read_replica_2" });
    //
    // // Create Drizzle instances from the pools
    // const primaryDb = drizzle({ client: primaryPool });
    // const read1 = drizzle({ client: read1Pool });
    // const read2 = drizzle({ client: read2Pool });
    //
    // // Use withReplicas to manage routing
    // const db = withReplicas(primaryDb, [read1, read2]);

    const logger = this.logger || false
    this.drizzle = drizzle({ client: this.pool, logger, schema: this.schema })

    if (this.readReplicaOptions) {
      const readReplicas = this.readReplicaOptions.map((connectionString) => {
        const options = {
          ...this.poolOptions,
          connectionString,
        }
        const pool = new this.pg.Pool(options)
        void connectWithReconnect({
          adapter: this,
          pool,
        })
        return drizzle({ client: pool, logger, schema: this.schema })
      })
      const myReplicas = withReplicas(this.drizzle, [readReplicas[0], readReplicas[1]])
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

      if (isCreated && this.connect) {
        await this.connect(options)
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
    process.exit(1)
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
    await this.migrate({ migrations: this.prodMigrations as unknown as Migration[] })
  }
}
