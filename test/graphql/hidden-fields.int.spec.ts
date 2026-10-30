import type { GraphQL as GraphQLTypes } from '@payloadcms/graphql/types'

import { configToSchema } from '@payloadcms/graphql'
import { GraphQL } from '@payloadcms/graphql/types'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { allHiddenGlobalSlug, allHiddenSlug, hiddenFieldsSlug, hiddenGlobalSlug } from './shared.js'

const { getNamedType, GraphQLNonNull, validateSchema } = GraphQL

const mutationNames = ['createHiddenFields', 'updateHiddenFields', 'updateHiddenGlobal']

const hiddenInputs = [
  { secret: 'external' },
  { hookSecret: 'external' },
  { rowSecret: 'external' },
  { collapsibleSecret: 'external' },
  { unnamedGroupSecret: 'external' },
  { tabSecret: 'external' },
  { group: { secret: 'external' } },
  { rows: [{ secret: 'external' }] },
  { namedTab: { secret: 'external' } },
  { emptyGroup: { secret: 'external' } },
  { emptyTab: { secret: 'external' } },
  { hiddenBlocks: [{ blockType: 'hidden-block', value: 'external' }] },
]

test.suite('GraphQL hidden mutation fields', { config: './config.ts' }, () => {
  for (const mutationName of mutationNames) {
    test(`should omit hidden fields from ${mutationName} inputs`, ({ payload }) => {
      const { schema } = configToSchema(payload.config)
      const mutation = schema.getMutationType()!.getFields()[mutationName]!
      const input = getNamedType(
        mutation.args.find(({ name }) => name === 'data')!.type,
      ) as GraphQLTypes.GraphQLInputObjectType
      const fields = input.getFields()

      expect(validateSchema(schema)).toEqual([])
      expect(Object.keys(fields)).toEqual(
        expect.arrayContaining([
          'visible',
          'adminOnly',
          'group',
          'rows',
          'rowVisible',
          'collapsibleVisible',
          'unnamedGroupVisible',
          'tabVisible',
          'namedTab',
          'blocks',
        ]),
      )
      const hiddenNames = hiddenInputs
        .map((data) => Object.keys(data)[0]!)
        .filter((name) => !['group', 'namedTab', 'rows'].includes(name))

      for (const name of hiddenNames) {
        expect(fields).not.toHaveProperty(name)
      }
      for (const name of ['group', 'rows', 'namedTab']) {
        const nestedInput = getNamedType(fields[name]!.type) as GraphQLTypes.GraphQLInputObjectType

        expect(nestedInput.getFields()).toHaveProperty('visible')
        expect(nestedInput.getFields()).not.toHaveProperty('secret')
      }
      expect(fields.group!.type).not.toBeInstanceOf(GraphQLNonNull)
      // Blocks retain their existing JSON scalar input contract.
      expect(getNamedType(fields.blocks!.type).name).toBe('JSON')
    })

    test(`should reject hidden inputs before ${mutationName} writes`, async ({
      payload,
      restClient,
    }) => {
      const doc = await payload.create({
        collection: hiddenFieldsSlug,
        data: {
          visible: 'original',
          secret: 'internal default',
          group: { secret: 'group default' },
        },
      })
      await payload.updateGlobal({
        slug: hiddenGlobalSlug,
        data: {
          visible: 'original',
          secret: 'original global',
          group: { secret: 'group default' },
        },
      })
      const { schema } = configToSchema(payload.config)
      const mutation = schema.getMutationType()!.getFields()[mutationName]!
      const inputType = getNamedType(mutation.args.find(({ name }) => name === 'data')!.type)
      const idType = mutation.args.find(({ name }) => name === 'id')?.type
      const isUpdate = mutationName === 'updateHiddenFields'
      const query = `mutation($data: ${inputType.toString()}! ${isUpdate ? `, $id: ${idType?.toString()}` : ''}) {
        ${mutationName}(data: $data ${isUpdate ? ', id: $id' : ''}) { ${mutationName === 'updateHiddenGlobal' ? 'visible' : 'id'} }
      }`

      for (const data of hiddenInputs) {
        const result = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({
              query,
              variables: { data, ...(isUpdate ? { id: doc.id } : {}) },
            }),
          })
          .then((response) => response.json())

        expect(result.data).toBeUndefined()
        expect(result.errors?.[0].message).toContain('is not defined by type')
      }
      const stored = await payload.findByID({
        collection: hiddenFieldsSlug,
        id: doc.id,
        showHiddenFields: true,
      })

      expect(stored.visible).toBe('original')
      expect(stored.secret).toBe('internal default')
      expect((await payload.count({ collection: hiddenFieldsSlug })).totalDocs).toBe(1)
      const global = await payload.findGlobal({ slug: hiddenGlobalSlug, showHiddenFields: true })

      expect(global).toMatchObject({ visible: 'original', secret: 'original global' })
    })
  }

  test('should write visible and admin-only fields while populating hidden defaults and hooks', async ({
    payload,
    restClient,
  }) => {
    const data = {
      visible: 'visible',
      adminOnly: 'admin hidden',
      group: { visible: 'group' },
      rows: [{ visible: 'array' }],
      namedTab: { visible: 'tab' },
      rowVisible: 'row',
      collapsibleVisible: 'collapsible',
      unnamedGroupVisible: 'unnamed group',
      tabVisible: 'unnamed tab',
      blocks: [{ blockType: 'hidden-fields-content', visible: 'block' }],
    }
    const created = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({
          query:
            'mutation($data: mutationHiddenFieldsInput!) { createHiddenFields(data: $data) { id visible adminOnly } }',
          variables: { data },
        }),
      })
      .then((response) => response.json())

    expect(created.errors).toBeUndefined()
    expect(created.data.createHiddenFields).toMatchObject({
      visible: data.visible,
      adminOnly: data.adminOnly,
    })
    const doc = await payload.findByID({
      collection: hiddenFieldsSlug,
      id: created.data.createHiddenFields.id,
      showHiddenFields: true,
    })

    expect(doc).toMatchObject({ ...data, secret: 'internal default', hookSecret: 'internal hook' })
    for (const mutationName of ['updateHiddenFields', 'updateHiddenGlobal']) {
      const { schema } = configToSchema(payload.config)
      const mutation = schema.getMutationType()!.getFields()[mutationName]!
      const inputType = getNamedType(mutation.args.find(({ name }) => name === 'data')!.type)
      const idType = mutation.args.find(({ name }) => name === 'id')?.type
      const isCollection = mutationName === 'updateHiddenFields'
      const result = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `mutation($data: ${inputType.toString()}! ${isCollection ? `, $id: ${idType?.toString()}` : ''}) {
          ${mutationName}(data: $data ${isCollection ? ', id: $id' : ''}) { visible adminOnly }
        }`,
            variables: {
              data: { ...data, visible: 'updated' },
              ...(isCollection ? { id: doc.id } : {}),
            },
          }),
        })
        .then((response) => response.json())

      expect(result.errors).toBeUndefined()
      expect(result.data[mutationName]).toEqual({ visible: 'updated', adminOnly: data.adminOnly })
    }
    const global = await payload.findGlobal({ slug: hiddenGlobalSlug, showHiddenFields: true })

    expect(global).toMatchObject({ secret: 'internal default', hookSecret: 'internal hook' })
  })

  test('should omit empty input types when all fields are hidden', ({ payload }) => {
    const { schema } = configToSchema(payload.config)
    const mutations = schema.getMutationType()!.getFields()

    expect(validateSchema(schema)).toEqual([])
    for (const name of ['createAllHidden', 'updateAllHidden']) {
      expect(mutations[name]!.args.map(({ name }) => name)).not.toContain('data')
    }
    expect(schema.getType('mutationAllHiddenInput')).toBeUndefined()
    const globalInput = schema.getType(
      'mutationAllHiddenGlobalInput',
    ) as GraphQLTypes.GraphQLInputObjectType

    // Globals retain their generated timestamp inputs even when all user fields are hidden.
    expect(Object.keys(globalInput.getFields()).sort()).toEqual(['createdAt', 'updatedAt'])
  })

  test('should create a document with only internal hidden defaults without a data argument', async ({
    payload,
    restClient,
  }) => {
    const result = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({
          query: 'mutation { createAllHidden { id } }',
        }),
      })
      .then((response) => response.json())

    expect(result.errors).toBeUndefined()
    const doc = await payload.findByID({
      collection: allHiddenSlug,
      id: result.data.createAllHidden.id,
      showHiddenFields: true,
    })

    expect(doc.secret).toBe('internal')
  })

  test('should update an all-hidden collection without a data argument', async ({
    payload,
    restClient,
  }) => {
    const doc = await payload.create({ collection: allHiddenSlug, data: { secret: 'original' } })
    const { schema } = configToSchema(payload.config)
    const idType = schema
      .getMutationType()!
      .getFields()
      .updateAllHidden!.args.find(({ name }) => name === 'id')!.type
    const result = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({
          query: `mutation($id: ${idType.toString()}) { updateAllHidden(id: $id) { id } }`,
          variables: { id: doc.id },
        }),
      })
      .then((response) => response.json())

    expect(result.errors).toBeUndefined()
    const stored = await payload.findByID({
      collection: allHiddenSlug,
      id: doc.id,
      showHiddenFields: true,
    })

    expect(stored.secret).toBe('original')
  })

  test('should update a global with only hidden user fields using empty data', async ({
    payload,
    restClient,
  }) => {
    const result = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({
          query: 'mutation { updateAllHiddenGlobal(data: {}) { updatedAt } }',
        }),
      })
      .then((response) => response.json())

    expect(result.errors).toBeUndefined()
    const global = await payload.findGlobal({ slug: allHiddenGlobalSlug, showHiddenFields: true })

    expect(global.secret).toBe('internal')
  })
})
