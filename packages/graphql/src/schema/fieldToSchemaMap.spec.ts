import type { DocumentVersion, Field, GraphQLInfo, SanitizedConfig } from 'payload'

import { GraphQLObjectType, GraphQLSchema, GraphQLString, graphql } from 'graphql'
import { describe, expect, it } from 'vitest'

import { rememberDocumentVersion } from '../utilities/documentVersion.js'
import { buildObjectType } from './buildObjectType.js'

const buildSelectorSchema = () => {
  const relatedType = new GraphQLObjectType({
    name: 'Related',
    fields: { title: { type: GraphQLString } },
  })
  const config = { collections: [{ slug: 'related' }], defaultDepth: 2 } as SanitizedConfig
  const graphqlResult = {
    collections: {
      related: { config: { versions: { drafts: true } }, graphQL: { type: relatedType } },
    },
    types: { groupTypes: {}, arrayTypes: {}, blockTypes: {} },
  } as unknown as GraphQLInfo
  const fields: Field[] = [
    { name: 'related', type: 'relationship', relationTo: 'related' },
    { name: 'upload', type: 'upload', relationTo: 'related' },
  ]
  const containerFields: Field[] = [
    ...fields,
    { name: 'group', type: 'group', fields },
    { type: 'tabs', tabs: [{ name: 'tab', fields }] },
  ]
  const type = buildObjectType({
    name: 'RootDoc',
    config,
    graphqlResult,
    parentName: 'RootDoc',
    fields: [...containerFields, { name: 'rows', type: 'array', fields: containerFields }],
  })
  const child = { related: '2', upload: '2' }
  const doc = {
    id: '1',
    ...child,
    group: { ...child },
    tab: { ...child },
    rows: [{ ...child, group: { ...child }, tab: { ...child } }],
  }

  return { type, doc }
}

const selection = `related { title } upload { title } explicitRelated: related(version: published) { title } explicitUpload: upload(version: published) { title }`

describe('GraphQL container selectors', () => {
  it.each(['published', 'draft', 'latest'] as const)(
    'should inherit %s through groups, tabs, and array containers',
    async (version) => {
      const { type, doc } = buildSelectorSchema()
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: { doc: { type, resolve: () => rememberDocumentVersion({ data: doc, version }) } },
        }),
      })
      const result = await graphql({
        schema,
        source: `{ doc { ${selection} group { ${selection} } tab { ${selection} } rows { ${selection} group { ${selection} } tab { ${selection} } } } }`,
        contextValue: {
          req: {
            payloadDataLoader: {
              load: async (key: string) => {
                const selectedVersion = (JSON.parse(key) as unknown[])[9] as DocumentVersion
                return { title: selectedVersion }
              },
            },
          },
        },
      })
      const expected = {
        related: { title: version },
        upload: { title: version },
        explicitRelated: { title: 'published' },
        explicitUpload: { title: 'published' },
      }

      expect(result.errors).toBeUndefined()
      expect(result.data?.doc).toEqual({
        ...expected,
        group: expected,
        tab: expected,
        rows: [{ ...expected, group: expected, tab: expected }],
      })
    },
  )
})
