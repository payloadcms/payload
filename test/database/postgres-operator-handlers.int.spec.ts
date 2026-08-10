import type { PostgresOperatorHandler } from '@payloadcms/drizzle/postgres'
import type { DatabaseAdapterObj, Payload, SanitizedConfig } from 'payload'

import { postgresAdapter, postgresUnaccent, sql } from '@payloadcms/db-postgres'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { BasePayload, buildConfig } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { defaultPostgresUrl } from '../dbAdapters.js'

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

const connectionString = process.env.POSTGRES_URL || defaultPostgresUrl

const getMinimalCollections = (prefix: string) => [
  {
    slug: `${prefix}-users` as const,
    auth: true,
    fields: [],
    versions: false,
  },
  {
    slug: `${prefix}-posts` as const,
    fields: [
      {
        name: 'title',
        type: 'text' as const,
      },
    ],
    versions: false,
  },
]

type AdapterFactory = (operatorHandlers?: PostgresOperatorHandler[]) => DatabaseAdapterObj<any>

const runOperatorHandlerConfigSuite = (
  label: string,
  prefix: string,
  createAdapter: AdapterFactory,
) => {
  const buildConfigWithOperatorHandlers = async (operatorHandlers?: PostgresOperatorHandler[]) =>
    buildConfig({
      db: createAdapter(operatorHandlers),
      collections: getMinimalCollections(prefix),
      secret: 'secret',
    })

  describePostgres(`${label} operator handlers - config surface`, () => {
    it('rejects at initialization when a handler requires a Postgres extension that is not configured, naming the handler and the extension', async () => {
      const config = await buildConfigWithOperatorHandlers([
        {
          name: 'fake-unaccent',
          operators: ['contains'],
          requiredExtensions: ['unaccent'],
          transformOperands: ({ column, value }) => ({ column, value }),
        },
      ])

      let thrown: unknown
      try {
        await new BasePayload().init({ config })
      } catch (error) {
        thrown = error
      }

      expect(thrown).toBeInstanceOf(Error)
      expect((thrown as Error).message).toContain('fake-unaccent')
      expect((thrown as Error).message).toContain('unaccent')
    })

    it('rejects at initialization when two replacement handlers target the same operator, naming both handlers and the operator', async () => {
      const config = await buildConfigWithOperatorHandlers([
        {
          name: 'handler-a',
          operators: ['contains'],
          build: ({ column }) => column as any,
        } as PostgresOperatorHandler,
        {
          name: 'handler-b',
          operators: ['contains'],
          build: ({ column }) => column as any,
        } as PostgresOperatorHandler,
      ])

      let thrown: unknown
      try {
        await new BasePayload().init({ config })
      } catch (error) {
        thrown = error
      }

      expect(thrown).toBeInstanceOf(Error)
      expect((thrown as Error).message).toContain('handler-a')
      expect((thrown as Error).message).toContain('handler-b')
      expect((thrown as Error).message).toContain('contains')
    })

    it('defaults operatorHandlers to an empty array when no query option is supplied', async () => {
      const config = await buildConfigWithOperatorHandlers(undefined)

      const payload = await new BasePayload().init({ config })

      try {
        expect((payload.db as unknown as { operatorHandlers: unknown[] }).operatorHandlers).toEqual(
          [],
        )
      } finally {
        await payload.destroy()
      }
    })
  })
}

runOperatorHandlerConfigSuite('postgres', 'operator-handlers', (operatorHandlers) =>
  postgresAdapter({
    pool: { connectionString },
    ...(operatorHandlers ? { query: { operatorHandlers } } : {}),
  }),
)

runOperatorHandlerConfigSuite('vercel postgres', 'operator-handlers-vercel', (operatorHandlers) =>
  vercelPostgresAdapter({
    pool: { connectionString },
    ...(operatorHandlers ? { query: { operatorHandlers } } : {}),
  }),
)

const getAccentCollections = () => [
  {
    slug: 'accent-users' as const,
    auth: true,
    fields: [],
    versions: false,
  },
  {
    slug: 'accent-items' as const,
    fields: [
      {
        name: 'title',
        type: 'text' as const,
      },
      {
        name: 'localizedTitle',
        type: 'text' as const,
        localized: true,
      },
      {
        name: 'group',
        type: 'group' as const,
        fields: [
          {
            name: 'note',
            type: 'text' as const,
          },
        ],
      },
      {
        name: 'tags',
        type: 'array' as const,
        fields: [
          {
            name: 'value',
            type: 'text' as const,
          },
        ],
      },
      {
        name: 'score',
        type: 'number' as const,
      },
      {
        name: 'scores',
        type: 'number' as const,
        hasMany: true,
      },
      {
        name: 'related',
        type: 'relationship' as const,
        relationTo: 'accent-items' as const,
      },
    ],
    versions: false,
  },
  {
    slug: 'accent-custom-id-items' as const,
    fields: [
      {
        name: 'id',
        type: 'text' as const,
      },
      {
        name: 'title',
        type: 'text' as const,
      },
    ],
    versions: false,
  },
]

const initPayload = async (config: Promise<SanitizedConfig>): Promise<Payload> =>
  new BasePayload().init({ config: await config })

describePostgres('postgres operator handlers - postgresUnaccent() behavior', () => {
  const activePayloads: Payload[] = []

  afterEach(async () => {
    while (activePayloads.length) {
      const payload = activePayloads.pop()
      await payload?.destroy()
    }
  })

  it('keeps Postgres accent-sensitive by default, without any handler configured', async () => {
    const payload = await initPayload(
      buildConfig({
        db: postgresAdapter({ pool: { connectionString } }),
        collections: getAccentCollections(),
        secret: 'secret',
      }),
    )
    activePayloads.push(payload)

    await payload.create({ collection: 'accent-items', data: { title: 'Ácido' } })

    const result = await payload.find({
      collection: 'accent-items',
      where: { title: { contains: 'acido' } },
    })

    expect(result.docs).toHaveLength(0)
  })

  it('rejects at initialization when postgresUnaccent() is configured without the unaccent extension, naming the handler and the extension', async () => {
    const config = buildConfig({
      db: postgresAdapter({
        pool: { connectionString },
        query: { operatorHandlers: [postgresUnaccent()] },
      }),
      collections: getAccentCollections(),
      secret: 'secret',
    })

    let thrown: unknown
    try {
      await initPayload(config)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toContain('postgres-unaccent')
    expect((thrown as Error).message).toContain('unaccent')
  })

  describe('with postgresUnaccent() configured', () => {
    // A single shared Payload instance is seeded once for every test in this block, rather than
    // one fresh instance per test: `pushDevSchema` caches the last-pushed schema at module scope
    // and skips re-pushing an identical schema, which would otherwise leave later tests querying
    // tables that were dropped (via PAYLOAD_DROP_DATABASE) but never recreated.
    let payload: Payload
    let richDoc: { id: number | string }
    let seeded: Record<string, number | string>

    beforeAll(async () => {
      payload = await initPayload(
        buildConfig({
          db: postgresAdapter({
            extensions: ['unaccent'],
            pool: { connectionString },
            query: { operatorHandlers: [postgresUnaccent()] },
          }),
          collections: getAccentCollections(),
          localization: {
            defaultLocale: 'en',
            locales: ['en', 'es'],
          },
          secret: 'secret',
        }),
      )

      const words = ['Ácido', 'Äpfel', 'Café', 'Niño', 'München']

      seeded = {}

      for (const word of words) {
        const doc = await payload.create({
          collection: 'accent-items',
          data: { title: word },
        })
        seeded[word] = doc.id
      }

      await payload.create({
        collection: 'accent-items',
        data: { title: 'Apple' },
      })

      richDoc = await payload.create({
        collection: 'accent-items',
        data: {
          title: 'Ácido Apple',
          group: { note: 'Ácido nota' },
          related: seeded['Ácido'],
          score: 42,
          scores: [1, 2, 3],
          tags: [{ value: 'Ácido tag' }],
        },
      })

      await payload.update({
        collection: 'accent-items',
        id: richDoc.id,
        data: { localizedTitle: 'Ácido' },
        locale: 'es',
      })

      await payload.update({
        collection: 'accent-items',
        id: richDoc.id,
        data: { localizedTitle: 'Acido' },
        locale: 'en',
      })
    })

    afterAll(async () => {
      await payload.destroy()
    })

    it('makes contains match accent-insensitively', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { title: { contains: 'acido' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual(
        expect.arrayContaining([seeded['Ácido']]),
      )
    })

    it('makes like match accent-insensitively', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { title: { like: 'nino' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([seeded['Niño']])
    })

    it('makes not_like exclude the accented match while including the others', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { title: { not_like: 'nino' } },
      })

      const ids = result.docs.map((doc: any) => doc.id)
      expect(ids).not.toContain(seeded['Niño'])
      expect(ids).toEqual(expect.arrayContaining([seeded['Ácido'], seeded['Äpfel']]))
    })

    it('remains case-insensitive together with accent normalization', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { title: { contains: 'ACIDO' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual(
        expect.arrayContaining([seeded['Ácido']]),
      )
    })

    it('transforms every word of a multi-word like query', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { title: { like: 'acido apple' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])
    })

    it('matches localized text content for the requested locale', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        locale: 'es',
        where: { localizedTitle: { contains: 'acido' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])
    })

    it('matches nested group text content', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { 'group.note': { contains: 'acido' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])
    })

    it('matches relational array sub-field text content', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { 'tags.value': { contains: 'acido' } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])
    })

    it('leaves numeric and null comparisons unchanged', async () => {
      const equalsResult = await payload.find({
        collection: 'accent-items',
        where: { score: { equals: 42 } },
      })
      expect(equalsResult.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])

      const existsResult = await payload.find({
        collection: 'accent-items',
        where: { score: { exists: false } },
      })
      expect(existsResult.docs.map((doc: any) => doc.id)).not.toContain(richDoc.id)
    })

    it("does not wrap a hasMany number field's contains query in unaccent()", async () => {
      // Postgres cannot ILIKE a `numeric` column at all - a pre-existing limitation of hasMany
      // number `contains` queries, unrelated to this feature. `postgresUnaccent()` declares
      // `fieldTypes: ['text', 'textarea']`, so the number field is excluded from the handler and
      // this fails the same way whether or not postgresUnaccent() is configured, instead of a
      // new, more confusing `function unaccent(numeric) does not exist` error.
      let thrown: unknown
      try {
        await payload.find({
          collection: 'accent-items',
          where: { scores: { contains: 2 } },
        })
      } catch (error) {
        thrown = error
      }

      expect(thrown).toBeDefined()
      expect(String((thrown as Error).message)).not.toContain('unaccent')
    })

    it('leaves relationship field queries unaffected', async () => {
      const result = await payload.find({
        collection: 'accent-items',
        where: { related: { equals: seeded['Ácido'] } },
      })

      expect(result.docs.map((doc: any) => doc.id)).toEqual([richDoc.id])
    })

    it('matches a genuine custom text-type id field accent-insensitively', async () => {
      await payload.create({
        collection: 'accent-custom-id-items',
        data: { id: 'acido-slug-ácido', title: 'Ácido slug' },
      })

      const result = await payload.find({
        collection: 'accent-custom-id-items',
        where: { id: { contains: 'acido-slug-acido' } },
      })

      expect(result.docs).toHaveLength(1)
    })
  })

  it.each(['uuid', 'uuidv7'] as const)(
    'does not wrap a native PgUUID id column in unaccent() when idType is %s',
    async (idType) => {
      const payload = await initPayload(
        buildConfig({
          db: postgresAdapter({
            extensions: ['unaccent'],
            idType,
            pool: { connectionString },
            query: { operatorHandlers: [postgresUnaccent()] },
          }),
          collections: getAccentCollections(),
          secret: 'secret',
        }),
      )
      activePayloads.push(payload)

      const doc = await payload.create({ collection: 'accent-items', data: { title: 'Ácido' } })

      // Postgres cannot ILIKE a native `uuid` column at all - a pre-existing limitation
      // unrelated to this feature. The PgUUID guard means a `contains` query against the id
      // column fails the same way whether or not postgresUnaccent() is configured, instead of
      // a new, more confusing `function unaccent(uuid) does not exist` error.
      let thrown: unknown
      try {
        await payload.find({
          collection: 'accent-items',
          where: { id: { contains: String(doc.id).slice(0, 8) } },
        })
      } catch (error) {
        thrown = error
      }

      expect(thrown).toBeDefined()
      expect(String((thrown as Error).message)).not.toContain('unaccent')

      const exactMatch = await payload.find({
        collection: 'accent-items',
        where: { id: { equals: doc.id } },
      })
      expect(exactMatch.docs).toHaveLength(1)
    },
  )

  it('supports a custom transformOperands handler calling a different SQL function', async () => {
    const payload = await initPayload(
      buildConfig({
        db: postgresAdapter({
          pool: { connectionString },
          query: {
            operatorHandlers: [
              {
                name: 'custom-lower',
                operators: ['contains'],
                transformOperands: ({ column, value }) => ({
                  column: sql`lower(${column})`,
                  value: typeof value === 'string' ? value.toLowerCase() : value,
                }),
              },
            ],
          },
        }),
        collections: getAccentCollections(),
        secret: 'secret',
      }),
    )
    activePayloads.push(payload)

    await payload.create({ collection: 'accent-items', data: { title: 'HELLO' } })

    const result = await payload.find({
      collection: 'accent-items',
      where: { title: { contains: 'hello' } },
    })

    expect(result.docs).toHaveLength(1)
  })
})
