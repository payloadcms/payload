import type { PgTable } from 'drizzle-orm/pg-core'

import { getTableConfig } from 'drizzle-orm/pg-core'

import type { DropDatabase } from './types.js'

import { getSchemaNames } from '../utilities/getSchemaNames.js'

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`

export const dropDatabase: DropDatabase = async function dropDatabase({ adapter }) {
  // Only the default schema is created again. Other schemas from `tableSchema` are created by `migrate` or push.
  const [defaultSchemaName, ...otherSchemaNames] = getSchemaNames({ adapter: this })

  // `public` may hold extensions, so it is never dropped unless it is the default schema.
  // The tables and enums that Payload built in it are dropped one by one instead.
  const publicStatements =
    defaultSchemaName !== 'public' && otherSchemaNames.includes('public')
      ? [
          ...Object.values<PgTable>(this.tables)
            .map((table) => getTableConfig(table))
            .filter(({ schema }) => !schema)
            .map(({ name }) => `drop table if exists "public".${quote(name)} cascade;`),
          ...Object.values(this.enums)
            .filter(({ schema }) => !schema)
            .map(({ enumName }) => `drop type if exists "public".${quote(enumName)} cascade;`),
        ]
      : []

  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: [
      ...otherSchemaNames
        .filter((schemaName) => schemaName !== 'public')
        .map((schemaName) => `drop schema if exists ${quote(schemaName)} cascade;`),
      ...publicStatements,
      `drop schema if exists ${defaultSchemaName} cascade;`,
      `create schema ${defaultSchemaName};`,
    ].join('\n    '),
  })
}
