import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Connect, Migration } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/node-mssql'
import mssql from 'mssql'

import type { MSSQLAdapter, MSSQLPoolOptions } from './types.js'

/**
 * Parses a `sqlserver://host:port;key=value;...` connection string (the JDBC-style format used by
 * Payload's test harness) into an `mssql` config object. If the pool options don't carry a
 * connection string, they are assumed to already be an `mssql` config.
 */
const resolveConfig = (poolOptions: MSSQLPoolOptions): mssql.config => {
  const { connectionString, ...rest } = poolOptions

  if (!connectionString) {
    return rest as mssql.config
  }

  const withoutProtocol = connectionString.replace(/^sqlserver:\/\//, '')
  const [hostPort, ...params] = withoutProtocol.split(';')
  const [server, port] = (hostPort ?? '').split(':')

  const opts: Record<string, string> = {}
  for (const param of params) {
    if (!param) {
      continue
    }
    const idx = param.indexOf('=')
    if (idx === -1) {
      continue
    }
    opts[param.slice(0, idx).trim().toLowerCase()] = param.slice(idx + 1)
  }

  return {
    database: opts.database,
    options: {
      encrypt: opts.encrypt === 'true',
      trustServerCertificate: opts.trustservercertificate !== 'false',
    },
    password: opts.password,
    port: port ? parseInt(port, 10) : 1433,
    server: server || 'localhost',
    user: opts.user,
    ...rest,
  } as mssql.config
}

const createDatabaseIfNotExists = async function (
  this: MSSQLAdapter,
  config: mssql.config,
): Promise<boolean> {
  const { database } = config
  if (!database) {
    return false
  }

  const masterPool = new mssql.ConnectionPool({ ...config, database: 'master' })

  try {
    await masterPool.connect()
    await masterPool
      .request()
      .batch(`IF DB_ID(N'${database}') IS NULL CREATE DATABASE [${database}];`)
    this.payload.logger.info(`Created database "${database}".`)
    return true
  } catch (err) {
    this.payload.logger.error({
      err,
      msg: `Error: cannot create database "${database}".`,
    })
    return false
  } finally {
    await masterPool.close()
  }
}

export const connect: Connect = async function connect(
  this: MSSQLAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  const config = resolveConfig(this.clientConfig)

  try {
    if (!this.client) {
      this.client = new mssql.ConnectionPool(config)
      await this.client.connect()
    }

    const logger = this.logger || false
    this.drizzle = drizzle({
      client: this.client,
      logger,
      relations: this.relations,
    }) as MSSQLAdapter['drizzle']

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    // SQL Server error 4060 (cannot open database) / 18456 (login failed) is raised when the
    // target database does not exist yet.
    const databaseMissing =
      /cannot open database/i.test(err.message) || /login failed/i.test(err.message)

    if (databaseMissing && !this.disableCreateDatabase) {
      this.payload.logger.info(`Database "${config.database}" does not exist, creating...`)
      const isCreated = await createDatabaseIfNotExists.call(this, config)

      if (isCreated && this.connect) {
        this.client = undefined as unknown as MSSQLAdapter['client']
        await this.connect(options)
        return
      }
    } else {
      this.payload.logger.error({
        err,
        msg: `Error: cannot connect to SQL Server. Details: ${err.message}`,
      })
    }

    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    throw new Error(`Error: cannot connect to SQL Server: ${err.message}`)
  }

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
