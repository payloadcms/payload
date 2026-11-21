import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { CollectionConfig, Payload } from 'payload'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { readdirSync, readFileSync, rmSync } from 'fs'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { afterEach, beforeEach, expect, vi } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { defaultPostgresUrl } from '../../dbAdapters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationDir = path.resolve(dirname, 'migrations')
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl

const schemas = { contacts: 'ts_contacts', listings: 'ts_listings', vehicles: 'ts_vehicles' }

type Resolver = NonNullable<Parameters<typeof postgresAdapter>[0]['tableSchema']>

// `_vehicles_v`, `vehicles_locales` and `enum_vehicles_fuel` all belong to the vehicles collection
const byCollection =
  (schemaOf: Record<string, string>): Resolver =>
  ({ name }) =>
    schemaOf[name.replace(/^(enum)?_+/, '').split('_')[0] ?? '']

const access = { create: () => true, delete: () => true, read: () => true, update: () => true }

// `buildConfig` mutates the collections, so every config gets its own copy
const getCollections = (): CollectionConfig[] => [
  {
    slug: 'contacts',
    access,
    fields: [
      { name: 'name', type: 'text' },
      { name: 'vehicles', type: 'join', collection: 'vehicles', on: 'owner' },
      { name: 'documents', type: 'join', collection: ['vehicles', 'listings'], on: 'owner' },
    ],
  },
  {
    slug: 'vehicles',
    access,
    fields: [
      { name: 'title', type: 'text', localized: true },
      { name: 'fuel', type: 'select', options: ['petrol', 'diesel'] },
      { name: 'tags', type: 'select', hasMany: true, options: ['new', 'used'] },
      { name: 'owner', type: 'relationship', relationTo: 'contacts' },
      { name: 'features', type: 'array', fields: [{ name: 'label', type: 'text' }] },
    ],
    versions: { drafts: true },
  },
  {
    slug: 'listings',
    access,
    fields: [
      { name: 'tags', type: 'select', hasMany: true, options: ['new', 'used'] },
      { name: 'owner', type: 'relationship', relationTo: 'contacts' },
    ],
  },
]

const startPayload = async ({
  push = false,
  schemaName,
  tableSchema = byCollection(schemas),
}: { push?: boolean; schemaName?: string; tableSchema?: Resolver } = {}) =>
  getPayload({
    config: await buildConfig({
      collections: getCollections(),
      db: postgresAdapter({
        migrationDir,
        pool: { connectionString },
        push,
        schemaName,
        tableSchema,
      }),
      localization: { defaultLocale: 'en', locales: ['en', 'de'] },
      secret: 'secret',
    }),
    key: `table-schema-${Math.random()}`,
  })

// Migration files are named by the second, and Node caches modules by path: a unique name per migration
let migrationCounter = 0
const createMigration = (payload: Payload, skipEmpty = false) =>
  payload.db.createMigration({
    migrationName: `table-schema-${migrationCounter++}`,
    payload,
    skipEmpty,
  })

const migrationFiles = () =>
  readdirSync(migrationDir).filter((file) => file.endsWith('.ts') && file !== 'index.ts')

const query = async (payload: Payload, raw: string, values?: unknown[]) =>
  (await (payload.db as unknown as PostgresAdapter).pool.query(raw, values)).rows

const names = async (payload: Payload, raw: string) => {
  const result: Record<string, string[]> = {}

  for (const row of await query(payload, raw)) {
    result[row.schema] = [...(result[row.schema] ?? []), row.name]
  }

  return result
}

const tablesBySchema = (payload: Payload) =>
  names(
    payload,
    `SELECT table_schema AS schema, table_name AS name FROM information_schema.tables
     WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY 1, 2`,
  )

const enumsBySchema = (payload: Payload) =>
  names(
    payload,
    `SELECT n.nspname AS schema, t.typname AS name FROM pg_type t
     JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype = 'e' ORDER BY 1, 2`,
  )

// Only the schemas that these tests use, so that other schemas in the database don't matter
const ownSchemas = ['Contact-Data', 'public', 'ts_default', ...Object.values(schemas)]

const existingSchemas = async (payload: Payload) =>
  (
    await query(
      payload,
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = ANY($1) ORDER BY 1`,
      [ownSchemas],
    )
  ).map((row) => row.schema_name)

const dropAll = async (payload: Payload) => {
  await payload.db.dropDatabase({ adapter: payload.db })
  // A custom default schema is created again by `dropDatabase`
  await query(payload, 'DROP SCHEMA IF EXISTS ts_default CASCADE')
  await payload.destroy()
}

const findPolymorphicJoinDocs = async (schemaName?: string) => {
  const payload = await startPayload({ schemaName })

  try {
    await payload.db.dropDatabase({ adapter: payload.db })
    await createMigration(payload)
    await payload.db.migrate()

    const contact = await payload.create({ collection: 'contacts', data: { name: 'Contact' } })
    await payload.create({ collection: 'vehicles', data: { owner: contact.id, tags: ['new'] } })
    await payload.create({ collection: 'listings', data: { owner: contact.id, tags: ['used'] } })

    const joins = { documents: { where: { tags: { in: ['used'] } } } }
    const result = await payload.findByID({ id: contact.id, collection: 'contacts', joins })

    return result.documents?.docs
  } finally {
    await dropAll(payload)
  }
}

test.suite('db-postgres tableSchema', { db: (adapter) => adapter === 'postgres' }, () => {
  // Every test creates its own migrations from scratch
  beforeEach(() => rmSync(migrationDir, { force: true, recursive: true }))
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(migrationDir, { force: true, recursive: true })
  })

  test('should place tables, versions, locales and enums in the resolved schemas', async () => {
    const payload = await startPayload()

    try {
      await payload.db.dropDatabase({ adapter: payload.db })
      await createMigration(payload)
      await payload.db.migrate()

      const tables = await tablesBySchema(payload)
      expect(tables[schemas.vehicles]).toEqual(
        expect.arrayContaining([
          'vehicles',
          'vehicles_locales',
          '_vehicles_v',
          '_vehicles_v_locales',
        ]),
      )
      expect(tables[schemas.contacts]).toContain('contacts')
      expect(tables[schemas.listings]).toContain('listings_tags')
      expect(tables.public).toContain('payload_migrations')
      expect(tables.public).not.toContain('vehicles')

      const enums = await enumsBySchema(payload)
      expect(enums[schemas.vehicles]).toContain('enum_vehicles_fuel')
      expect(enums.public).toContain('_locales')
      expect(enums.public).not.toContain('enum_vehicles_fuel')

      // Every schema in use is dropped, only the default schema is created again
      await payload.db.dropDatabase({ adapter: payload.db })
      expect(await existingSchemas(payload)).toEqual(['public'])
    } finally {
      await dropAll(payload)
    }
  })

  test('should start a second time with push without creating the schemas again', async () => {
    vi.stubEnv('PAYLOAD_FORCE_DRIZZLE_PUSH', 'true')
    let payload = await startPayload({ push: true })

    try {
      expect((await tablesBySchema(payload))[schemas.vehicles]).toContain('vehicles')
      await payload.create({ collection: 'contacts', data: { name: 'Kept' } })
      await payload.destroy()

      // The test setup sets PAYLOAD_DROP_DATABASE, which would drop everything again on every start
      vi.stubEnv('PAYLOAD_DROP_DATABASE', 'false')
      payload = await startPayload({ push: true })

      const kept = await payload.find({
        collection: 'contacts',
        where: { name: { equals: 'Kept' } },
      })
      expect(kept.totalDocs).toBe(1)
    } finally {
      vi.stubEnv('PAYLOAD_DROP_DATABASE', 'true')
      await dropAll(payload)
    }
  })

  test('should query relationships, joins and localized fields across schemas', async () => {
    const payload = await startPayload()

    try {
      await payload.db.dropDatabase({ adapter: payload.db })
      await createMigration(payload)
      await payload.db.migrate()

      const contact = await payload.create({ collection: 'contacts', data: { name: 'Contact' } })
      const vehicle = await payload.create({
        collection: 'vehicles',
        data: {
          title: 'Car',
          features: [{ label: 'Heated seats' }],
          owner: contact.id,
          tags: ['new'],
        },
        draft: false,
      })
      await payload.create({ collection: 'listings', data: { owner: contact.id, tags: ['used'] } })
      await payload.update({
        id: vehicle.id,
        collection: 'vehicles',
        data: { title: 'Auto' },
        locale: 'de',
      })

      const german = await payload.findByID({
        id: vehicle.id,
        collection: 'vehicles',
        depth: 1,
        locale: 'de',
      })
      expect(german.title).toBe('Auto')
      expect(german.owner).toMatchObject({ name: 'Contact' })

      const byOwnerName = await payload.find({
        collection: 'vehicles',
        where: { 'owner.name': { equals: 'Contact' } },
      })
      expect(byOwnerName.totalDocs).toBe(1)

      const versions = await payload.findVersions({
        collection: 'vehicles',
        where: { parent: { equals: vehicle.id } },
      })
      expect(versions.totalDocs).toBeGreaterThanOrEqual(2)

      const joined = await payload.findByID({ id: contact.id, collection: 'contacts', depth: 1 })
      expect(joined.vehicles?.docs).toHaveLength(1)
      expect(joined.documents?.docs).toHaveLength(2)
    } finally {
      await dropAll(payload)
    }
  })

  test('should filter a polymorphic join by a select field with several values across schemas', async () => {
    const docs = await findPolymorphicJoinDocs()

    expect(docs).toHaveLength(1)
    expect(docs?.[0]).toMatchObject({ relationTo: 'listings' })
  })

  test('should quote schema names with upper-case letters and hyphens', async () => {
    const tableSchema = byCollection({ contacts: 'Contact-Data', vehicles: schemas.vehicles })
    const payload = await startPayload({ tableSchema })

    try {
      await payload.db.dropDatabase({ adapter: payload.db })
      await createMigration(payload)
      await payload.db.migrate()
      expect(await existingSchemas(payload)).toContain('Contact-Data')

      // migrate:fresh only works if `dropDatabase` found the exact schema name
      await payload.db.migrateFresh({ forceAcceptWarning: true })
      expect((await tablesBySchema(payload))['Contact-Data']).toContain('contacts')

      await payload.db.dropDatabase({ adapter: payload.db })
      expect(await existingSchemas(payload)).toEqual(['public'])
    } finally {
      await dropAll(payload)
    }
  })

  // `ts_default` makes the default schema a custom one, so that the migrations table is looked up by schema name.
  // These tests come last: `createMigration` shares one base snapshot, and `schemaName` changes it for later runs.
  for (const defaultSchema of [undefined, 'ts_default']) {
    test(`should run migrate, migrate down and migrate:fresh (default schema: ${defaultSchema ?? 'public'})`, async () => {
      const payload = await startPayload({ schemaName: defaultSchema })
      const migrationCount = async () =>
        (
          await query(
            payload,
            `SELECT name FROM "${defaultSchema ?? 'public'}"."payload_migrations"`,
          )
        ).length

      try {
        await payload.db.dropDatabase({ adapter: payload.db })
        await createMigration(payload)
        const source = readFileSync(path.resolve(migrationDir, migrationFiles()[0] ?? ''), 'utf8')
        expect(source).toContain(`CREATE SCHEMA "${schemas.contacts}"`)
        expect(source).not.toContain(`CREATE SCHEMA "${defaultSchema ?? 'public'}"`)

        await payload.db.migrate()
        expect(await migrationCount()).toBe(1)
        expect(Object.keys(await tablesBySchema(payload))).toContain(schemas.vehicles)

        // The base snapshot knows every schema, so nothing is left to migrate
        await createMigration(payload, true)
        expect(migrationFiles()).toHaveLength(1)

        await payload.db.migrateDown()
        expect(await existingSchemas(payload)).not.toContain(schemas.vehicles)

        await payload.db.migrate()
        await payload.create({ collection: 'contacts', data: { name: 'Before fresh' } })
        await payload.db.migrateFresh({ forceAcceptWarning: true })

        expect(await migrationCount()).toBe(1)
        expect((await payload.count({ collection: 'contacts' })).totalDocs).toBe(0)
      } finally {
        await dropAll(payload)
      }
    })
  }

  test('should not drop the public schema when it is not the default schema', async () => {
    const tableSchema = byCollection({
      contacts: 'public',
      listings: schemas.listings,
      vehicles: 'public',
    })
    const payload = await startPayload({ schemaName: 'ts_default', tableSchema })

    try {
      await payload.db.dropDatabase({ adapter: payload.db })
      await createMigration(payload)
      await payload.db.migrate()
      await query(payload, 'CREATE TABLE public.ts_marker (id integer)')
      expect((await tablesBySchema(payload)).public).toContain('contacts')
      expect((await enumsBySchema(payload)).public).toContain('enum_vehicles_fuel')

      await payload.db.dropDatabase({ adapter: payload.db })

      // The tables Payload built in `public` are gone, everything else in it stays
      expect((await tablesBySchema(payload)).public).toEqual(['ts_marker'])
      expect((await enumsBySchema(payload)).public ?? []).not.toContain('enum_vehicles_fuel')
      expect(await existingSchemas(payload)).toEqual(['public', 'ts_default'])
    } finally {
      await query(payload, 'DROP TABLE IF EXISTS public.ts_marker')
      await dropAll(payload)
    }
  })
  // The parent table of the join has to be qualified by its own schema when `schemaName` is set
  test('should filter a polymorphic join across schemas with a custom default schema', async () => {
    const docs = await findPolymorphicJoinDocs('ts_default')

    expect(docs).toHaveLength(1)
    expect(docs?.[0]).toMatchObject({ relationTo: 'listings' })
  })
})
