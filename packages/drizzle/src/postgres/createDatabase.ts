import type { ClientConfig } from 'pg'

import pg from 'pg'

import type { BasePostgresAdapter } from './types.js'

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
  // DATABASE_URL - default Vercel env
  const connectionString = this.poolOptions?.connectionString ?? process.env.DATABASE_URL
  let managementClientConfig: ClientConfig = {}
  let dbName = args.name
  const schemaName = this.schemaName || 'public'

  if (connectionString) {
    const connectionURL = new URL(connectionString)
    if (!dbName) {
      dbName = connectionURL.pathname.slice(1)
    }

    const managementConnectionURL = new URL(connectionURL)
    managementConnectionURL.pathname = '/postgres'
    managementClientConfig.connectionString = managementConnectionURL.toString()
  } else {
    if (!dbName) {
      dbName = this.poolOptions.database
    }

    managementClientConfig = {
      ...this.poolOptions,
      database: 'postgres',
    }
  }

  const managementClient = new pg.Client(managementClientConfig)

  try {
    await managementClient.connect()
    await managementClient.query(`CREATE DATABASE ${dbName}`)

    this.payload.logger.info(`Created database ${dbName}`)

    if (schemaName !== 'public') {
      const createdDatabaseClient = new pg.Client({
        ...managementClientConfig,
        database: dbName,
      })
      try {
        await createdDatabaseClient.connect()

        await createdDatabaseClient.query(`CREATE SCHEMA ${schemaName}`)
        this.payload.logger.info(`Created schema ${schemaName}`)
      } catch (err) {
        this.payload.logger.error({
          err,
          msg: `Error: failed to create schema ${schemaName}. Details: ${err.message}`,
        })
      } finally {
        await createdDatabaseClient.end()
      }
    }

    return true
  } catch (err) {
    this.payload.logger.error(
      `Error: failed to create database ${dbName}. Details: ${err.message}`,
      err,
    )

    return false
  } finally {
    await managementClient.end()
  }
}
