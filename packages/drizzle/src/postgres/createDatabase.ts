import type { ClientConfig } from 'pg'

import type { BasePostgresAdapter } from './types.js'

const setConnectionStringDatabase = ({
  connectionString,
  database,
}: {
  connectionString: string
  database: string
}): string => {
  const connectionURL = new URL(connectionString)
  const newConnectionURL = new URL(connectionURL)
  newConnectionURL.pathname = `/${database}`

  return newConnectionURL.toString()
}

type Args = {
  /**
   * Name of a database, defaults to the current one
   */
  name?: string
  /**
   * Schema to create in addition to 'public'. Defaults to adapter.schemaName if exists.
   */
  schemaName?: string
}
export const createDatabase = async function (this: BasePostgresAdapter, args: Args = {}) {
  // POSTGRES_URL - default Vercel env
  const connectionString =
    this.poolOptions?.connectionString ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  let managementClientConfig: ClientConfig = {}
  let dbName = args.name
  const schemaName = this.schemaName || 'public'

  if (connectionString) {
    if (!dbName) {
      dbName = new URL(connectionString).pathname.slice(1)
    }

    managementClientConfig.connectionString = setConnectionStringDatabase({
      connectionString,
      database: 'postgres',
    })
  } else {
    if (!dbName) {
      dbName = this.poolOptions.database
    }

    managementClientConfig = {
      ...this.poolOptions,
      database: 'postgres',
    }
  }

  // import pg only when createDatabase is used
  const pg = await import('pg').then((mod) => mod.default)

  const managementClient = new pg.Client(managementClientConfig)

  try {
    await managementClient.connect()
    await managementClient.query(`CREATE DATABASE "${dbName}"`)

    this.payload.logger.info(`Created database "${dbName}"`)

    if (schemaName !== 'public') {
      let createdDatabaseConfig: ClientConfig = {}

      if (connectionString) {
        createdDatabaseConfig.connectionString = setConnectionStringDatabase({
          connectionString,
          database: dbName,
        })
      } else {
        createdDatabaseConfig = {
          ...this.poolOptions,
          database: dbName,
        }
      }

      const createdDatabaseClient = new pg.Client(createdDatabaseConfig)

      try {
        await createdDatabaseClient.connect()

        await createdDatabaseClient.query(`CREATE SCHEMA ${schemaName}`)
        this.payload.logger.info(`Created schema "${dbName}.${schemaName}"`)
      } catch (err) {
        this.payload.logger.error({
          err,
          msg: `Error: failed to create schema "${dbName}.${schemaName}". Details: ${err.message}`,
        })
      } finally {
        await createdDatabaseClient.end()
      }
    }

    return true
  } catch (err) {
    this.payload.logger.error({
      err,
      msg: `Error: failed to create database ${dbName}. Details: ${err.message}`,
    })

    return false
  } finally {
    await managementClient.end()
  }
}
