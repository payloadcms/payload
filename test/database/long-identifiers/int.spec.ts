import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Payload } from 'payload'

import { sql } from 'drizzle-orm'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Long enough that the generated index and foreign key names of the array, select and
// relationship tables go past the 63-char Postgres limit, while the table names still fit.
const prefix = 'x'.repeat(54)
// `enum_p_<name>` must still fit, so the select field is a bit shorter.
const selectName = `${'x'.repeat(48)}_sel`
// Column names over 63 chars are a separate problem, so `<group>_parent_id` (55 chars) still
// fits while the Drizzle foreign key names `p_<group>_author_authors_id_fk` and
// `p_<group>_parent_p_id_fk` don't.
const longGroupName = 'g'.repeat(45)

test.suite(
  'Long identifiers',
  { db: (adapter) => ['postgres', 'postgres-custom-schema', 'postgres-uuid'].includes(adapter) },
  () => {
    let payload: Payload

    test.beforeAll(async () => {
      const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const init = databaseAdapter.init

      databaseAdapter.init = (args) => {
        const adapter = init(args)
        adapter.push = true
        return adapter
      }

      const config = await buildConfig({
        db: databaseAdapter,
        secret: 'secret',
        collections: [
          {
            slug: 'p',
            fields: [
              { name: `${prefix}_alpha`, type: 'array', fields: [{ name: 't', type: 'text' }] },
              { name: `${prefix}_beta`, type: 'array', fields: [{ name: 't', type: 'text' }] },
              {
                name: selectName,
                type: 'select',
                hasMany: true,
                index: true,
                options: ['a', 'b'],
              },
              {
                name: longGroupName,
                type: 'group',
                fields: [
                  { name: 'author', type: 'relationship', relationTo: 'authors' },
                  { name: 'parent', type: 'relationship', relationTo: 'p' },
                ],
              },
            ],
            versions: false,
          },
          {
            slug: 'authors',
            fields: [],
            versions: false,
          },
        ],
      })

      payload = await getPayload({ config })
    })

    test.afterAll(async () => {
      if (!payload) {
        return
      }

      await payload.db.dropDatabase({ adapter: payload.db as never })
      await payload.destroy()
    })

    test('should store every generated index and foreign key name in full', async () => {
      const adapter = payload.db as unknown as DrizzleAdapter

      const expected = Object.values(adapter.rawTables).flatMap((table) => [
        ...Object.values(table.indexes ?? {}).map(({ name }) => name),
        ...Object.values(table.foreignKeys ?? {}).map(({ name }) => name),
      ])

      const longNames = expected.filter(
        (name) =>
          name.includes(prefix) || name.includes(selectName) || name.includes(longGroupName),
      )

      expect(longNames.length).toBeGreaterThan(0)

      for (const name of expected) {
        expect(name.length).toBeLessThanOrEqual(63)
      }

      const { rows } = await adapter.drizzle.execute<{ name: string }>(sql`
        SELECT indexname AS name FROM pg_indexes
        UNION SELECT conname AS name FROM pg_constraint WHERE contype = 'f'
      `)

      const stored = new Set(rows.map(({ name }) => name))

      for (const name of longNames) {
        expect(stored.has(name), `missing ${name}`).toBe(true)
      }
    })

    test('should not change anything when the same schema is pushed again', async () => {
      const adapter = payload.db as unknown as DrizzleAdapter & { schemaName?: string }

      const { pushSchema } = await adapter.requireDrizzleKit()

      const result = (await pushSchema(
        adapter.schema,
        adapter.drizzle,
        adapter.schemaName ? [adapter.schemaName] : undefined,
      )) as { statementsToExecute: string[] }

      // Only this suite's tables. The default `users` collection has an unrelated
      // `login_attempts` default that push always re-applies.
      const statements = result.statementsToExecute.filter((statement) =>
        /"(p|authors)(_[^"]*)?"/.test(statement),
      )

      expect(statements).toEqual([])
    })
  },
)
