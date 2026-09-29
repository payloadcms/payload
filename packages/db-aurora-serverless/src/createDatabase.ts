import type { CreateDatabase } from '@payloadcms/drizzle/postgres'

import type { AuroraServerlessAdapter } from './types.js'

/**
 * The RDS Data API cannot run `CREATE DATABASE` (and the target database is fixed by the
 * `resourceArn`/`secretArn` pair), so auto-creation is unsupported. Create the database and schema
 * out-of-band, then run Payload with the default `disableCreateDatabase: true`.
 */
export const createDatabase: CreateDatabase = function createDatabase(
  this: AuroraServerlessAdapter,
) {
  this.payload.logger.error({
    msg: `Cannot create database "${this.connection.database}" because the RDS Data API does not support CREATE DATABASE. Create the database and its schema out-of-band before starting Payload.`,
  })

  return Promise.resolve(false)
}
