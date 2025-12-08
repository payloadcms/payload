/**
 * Template for localizeStatus migration
 * Transforms version._status from single value to per-locale object
 */

export const localizeStatusTemplate = (options: {
  collectionSlug?: string
  dbType: 'mongodb' | 'postgres' | 'sqlite'
  globalSlug?: string
}): string => {
  const { collectionSlug, dbType, globalSlug } = options
  const entity = collectionSlug
    ? `collectionSlug: '${collectionSlug}'`
    : `globalSlug: '${globalSlug}'`

  if (dbType === 'mongodb') {
    return `import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-mongodb'
import { localizeStatus } from 'payload'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await localizeStatus.up({
    ${entity},
    payload,
    req,
  })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await localizeStatus.down({
    ${entity},
    payload,
    req,
  })
}
`
  }

  // SQL databases (Postgres, SQLite)
  return `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-${dbType}'
import { localizeStatus } from 'payload'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await localizeStatus.up({
    ${entity},
    db,
    payload,
    req,
    sql,
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await localizeStatus.down({
    ${entity},
    db,
    payload,
    req,
    sql,
  })
}
`
}
