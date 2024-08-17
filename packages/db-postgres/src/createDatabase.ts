import type { ClientConfig } from 'pg'

import pg from 'pg'

import type { PostgresAdapter } from './types.js'

export const createDatabase = async (adapter: PostgresAdapter): Promise<boolean> => {
  let managementClientConfig: ClientConfig = {}
  let dbName: string

  if (adapter.poolOptions.connectionString) {
    const connectionURL = new URL(adapter.poolOptions.connectionString)

    dbName = connectionURL.pathname.slice(1)

    const managementConnectionURL = new URL(connectionURL)

    managementConnectionURL.pathname = '/postgres'
    managementClientConfig.connectionString = managementConnectionURL.toString()
  } else {
    dbName = adapter.poolOptions.database
    managementClientConfig = {
      ...adapter.poolOptions,
      database: 'postgres',
    }
  }

  const managementClient = new pg.Client(managementClientConfig)

  try {
    await managementClient.connect()
    await managementClient.query(`CREATE DATABASE ${dbName}`)

    adapter.payload.logger.info(`Created database ${dbName}`)

    return true
  } catch (err) {
    adapter.payload.logger.error(
      `Error: failed to create database ${dbName}. Details: ${err.message}`,
      err,
    )

    return false
  } finally {
    await managementClient.end?.()
  }
}
