import { describe, expect, it, vi } from 'vitest'

import { addFieldStatePromise } from './addFieldStatePromise.js'

vi.mock('payload', () => ({
  getBlockSelect: () => ({ blockSelect: undefined, blockSelectMode: undefined }),
  stripUnselectedFields: () => true,
  validateBlocksFilterOptions: vi.fn(),
}))

vi.mock('payload/shared', () => ({
  deepCopyObjectSimple: (value: unknown) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value)),
  fieldAffectsData: (field: { name?: string }) => 'name' in field,
  fieldHasSubFields: (field: { fields?: unknown; tabs?: unknown }) =>
    'fields' in field || 'tabs' in field,
  fieldIsHiddenOrDisabled: () => false,
  fieldIsID: () => false,
  fieldIsLocalized: () => false,
  getFieldPaths: ({
    field,
    parentPath,
    parentSchemaPath,
  }: {
    field: { name?: string }
    parentPath: string
    parentSchemaPath: string
  }) => ({
    indexPath: '',
    path: parentPath ? `${parentPath}.${field.name}` : (field.name ?? ''),
    schemaPath: parentSchemaPath ? `${parentSchemaPath}.${field.name}` : (field.name ?? ''),
  }),
  tabHasName: () => false,
}))

const textBlock = {
  slug: 'textBlock',
  fields: [{ name: 'text', type: 'text' }],
}

const blocksField = {
  admin: {},
  blocks: [textBlock],
  name: 'layout',
  type: 'blocks',
}

const createReq = () => ({
  payload: {
    blocks: { textBlock },
    config: {},
    logger: { error: vi.fn(), warn: vi.fn() },
  },
  user: null,
})

const buildState = async ({ data, req }: { data: Record<string, unknown>; req: any }) => {
  const state: Record<string, unknown> = {}

  await addFieldStatePromise({
    addErrorPathToParent: () => {},
    blockData: undefined,
    collectionSlug: 'posts',
    data,
    field: blocksField,
    fieldIndex: 0,
    fieldSchemaMap: new Map(),
    fullData: data,
    id: 'doc1',
    indexPath: '',
    operation: 'update',
    parentIndexPath: '',
    parentPath: '',
    parentPermissions: true,
    parentSchemaPath: 'posts',
    passesCondition: true,
    path: 'layout',
    preferences: {},
    previousFormState: {},
    renderAllFields: false,
    renderFieldFn: undefined,
    req,
    schemaPath: 'posts.layout',
    skipValidation: true,
    state,
  } as any)

  return state
}

describe('addFieldStatePromise - blocks with malformed rows', () => {
  it('should skip a block row with no blockType instead of failing the whole form state', async () => {
    const req = createReq()
    const data = {
      layout: [
        { blockType: 'textBlock', id: 'row1', text: 'hello' },
        // Malformed row, e.g. rehydrated from a gap in the persisted `_order`
        // sequence (see #17508): no `blockType` at all.
        { id: 'row2' },
        { blockType: 'textBlock', id: 'row3', text: 'world' },
      ],
    }

    const state = await buildState({ data, req })

    const rows = (state['layout'] as { rows: Array<{ id: string }> }).rows

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.id)).toEqual(['row1', 'row3'])
    expect(req.payload.logger.warn).toHaveBeenCalledTimes(1)
    expect(req.payload.logger.warn).toHaveBeenCalledWith({
      msg: expect.stringContaining('posts.layout.1'),
    })

    // The surviving rows still get their subfield state
    expect((state['layout.0.text'] as { value: string }).value).toBe('hello')
    expect((state['layout.2.text'] as { value: string }).value).toBe('world')
  })

  it('should skip null rows without throwing', async () => {
    const req = createReq()
    const data = {
      layout: [{ blockType: 'textBlock', id: 'row1', text: 'hello' }, null],
    }

    const state = await buildState({ data, req })

    const rows = (state['layout'] as { rows: Array<{ id: string }> }).rows

    expect(rows).toHaveLength(1)
    expect(req.payload.logger.warn).toHaveBeenCalledTimes(1)
  })

  it('should still throw for a named block type that is not in the config', async () => {
    const req = createReq()
    const data = {
      layout: [{ blockType: 'nope', id: 'row1' }],
    }

    await expect(buildState({ data, req })).rejects.toThrow(
      'Block with type "nope" was found in block data, but no block with that type is defined in the config for field with schema path posts.layout.',
    )
    expect(req.payload.logger.warn).not.toHaveBeenCalled()
  })
})
