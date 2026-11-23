import type { Config } from 'payload'

import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { sanitizeConfig } from 'payload'
import { afterEach, describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { columnToCodeConverter } from '../postgres/columnToCodeConverter.js'
import { setColumnID } from '../postgres/schema/setColumnID.js'
import { buildRawSchema } from '../schema/buildRawSchema.js'
import { createSchemaGenerator } from './createSchemaGenerator.js'

const generateSchema = createSchemaGenerator({
  columnToCodeConverter,
  corePackageSuffix: 'pg-core',
  defaultOutputFile: undefined,
  enumImport: 'pgEnum',
  schemaImport: 'pgSchema',
  tableImport: 'pgTable',
})

const createAdapter = (config: Config): DrizzleAdapter => {
  const sanitized = sanitizeConfig(config)

  return {
    name: 'postgres',
    blocksAsJSON: false,
    fieldConstraints: {},
    idType: 'serial',
    localesSuffix: '_locales',
    packageName: '@payloadcms/db-postgres',
    payload: {
      blocks: {},
      collections: Object.fromEntries(
        sanitized.collections.map((collection) => [
          collection.slug,
          { config: collection, customIDType: undefined },
        ]),
      ),
      config: sanitized,
      logger: { warn: () => {} },
    },
    rawRelations: {},
    rawTables: {},
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  } as unknown as DrizzleAdapter
}

let outputDir: string | undefined

afterEach(async () => {
  if (outputDir) {
    await rm(outputDir, { force: true, recursive: true })
    outputDir = undefined
  }
})

const generate = async (adapter: DrizzleAdapter): Promise<string> => {
  buildRawSchema({ adapter, setColumnID })

  outputDir = await mkdtemp(path.join(tmpdir(), 'payload-schema-'))
  const outputFile = path.join(outputDir, 'schema.ts')

  await generateSchema.call(adapter, { log: false, outputFile, prettify: false })

  return readFile(outputFile, 'utf8')
}

const longGroupName = 'some_long_group_name_that_pushes_the_fk_over_the_limit'

describe('createSchemaGenerator', () => {
  it('should type the extras callback when a promoted foreign key references its own table', async () => {
    const adapter = createAdapter({
      collections: [
        {
          slug: 'pages',
          fields: [
            {
              name: longGroupName,
              type: 'group',
              fields: [{ name: 'parent', type: 'relationship', relationTo: 'pages' }],
            },
          ],
          timestamps: false,
          versions: false,
        },
      ],
    } as Config)

    const schema = await generate(adapter)

    expect(adapter.rawTables.pages.foreignKeys).toBeDefined()
    expect(schema).toContain('type PgTableExtraConfigValue')
    expect(schema).toMatch(/\(columns\): PgTableExtraConfigValue\[\] => \[/)
  })

  it('should treat promoted foreign keys as edges when detecting circular references', async () => {
    const adapter = createAdapter({
      collections: [
        {
          slug: 'members',
          fields: [
            {
              name: longGroupName,
              type: 'group',
              fields: [{ name: 'avatar', type: 'upload', relationTo: 'media' }],
            },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'media',
          fields: [{ name: 'owner', type: 'relationship', relationTo: 'members' }],
          timestamps: false,
          versions: false,
          upload: true,
        },
      ],
    } as Config)

    const schema = await generate(adapter)

    // `members` -> `media` is promoted to a table-level foreign key, `media` -> `members` stays
    // inline. Both sides of the cycle need an explicit type.
    expect(adapter.rawTables.members.columns[`${longGroupName}_avatar`].reference).toBeUndefined()
    expect(schema).toMatch(/\(\): AnyPgColumn => members\.id/)
    expect(schema).toMatch(/\(columns\): PgTableExtraConfigValue\[\] => \[/)
  })

  it('should leave the extras callback untyped when no foreign key points back at the table', async () => {
    const adapter = createAdapter({
      collections: [
        {
          slug: 'posts',
          fields: [{ name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text' }] }],
          timestamps: false,
          versions: false,
        },
      ],
    } as Config)

    const schema = await generate(adapter)

    expect(schema).not.toContain('PgTableExtraConfigValue')
    expect(schema).toContain('(columns) => [')
  })
})
