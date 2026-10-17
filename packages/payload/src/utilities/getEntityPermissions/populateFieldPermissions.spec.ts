import type { Block, Field } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { populateFieldPermissions } from './populateFieldPermissions.js'

type Args = Parameters<typeof populateFieldPermissions>[0]

function args(fields: Field[], blocks: Record<string, Block> = {}): Args {
  return {
    blockReferencesPermissions: {},
    data: undefined,
    fields,
    operations: ['read', 'update', 'delete'],
    parentPermissionsObject: { read: { permission: true }, update: { permission: false } },
    permissionsObject: {},
    promises: [],
    req: { payload: { blocks } } as unknown as PayloadRequest,
  }
}

function references(count: number): Field[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `field${index}`,
    type: 'blocks',
    blockReferences: ['shared'],
    blocks: [],
  }))
}

async function run(input: Args) {
  populateFieldPermissions(input)
  await Promise.all(input.promises)
  return input.permissionsObject
}

describe('populateFieldPermissions shared schema traversal', () => {
  it('visits access-free shared block fields once regardless of the reference count', async () => {
    const name = vi.fn(() => 'text')
    const blocks: Record<string, Block> = {
      shared: {
        slug: 'shared',
        fields: [
          {
            get name() {
              return name()
            },
            type: 'text',
          },
        ],
      },
    }
    await run(args(references(1), blocks))
    const singleVisit = name.mock.calls.length
    name.mockClear()
    const output = await run(args(references(100), blocks))
    expect(name).toHaveBeenCalledTimes(singleVisit)
    expect(output.field99).toEqual(output.field0)
    expect(output.field99).toMatchObject({
      blocks: {
        shared: { fields: { text: { read: { permission: true }, update: { permission: false } } } },
      },
    })
    expect(output.field99).not.toHaveProperty('delete')
  })

  it.each([false, true])('runs custom access for every reference (async: %s)', async (isAsync: boolean) => {
    const access = vi.fn(() => (isAsync ? Promise.resolve(false) : false))
    const blocks: Record<string, Block> = {
      shared: {
        slug: 'shared',
        fields: [{ name: 'secret', type: 'text', access: { read: access } }],
      },
    }
    const output = await run(args(references(100), blocks))
    expect(access).toHaveBeenCalledTimes(100)
    expect(output.field99).toMatchObject({
      blocks: { shared: { fields: { secret: { read: { permission: false } } } } },
    })
  })

  it('detects custom access inside tabs, unnamed groups and inline blocks', async () => {
    const access = vi.fn(() => true)
    const guarded: Field = { name: 'secret', type: 'text', access: { read: access } }
    const blocks: Record<string, Block> = {
      shared: {
        slug: 'shared',
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                label: 'Tab',
                fields: [
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'nested',
                        type: 'blocks',
                        blocks: [{ slug: 'inline', fields: [guarded] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }
    await run(args(references(10), blocks))
    expect(access).toHaveBeenCalledTimes(10)
  })

  it('does not reuse authorization results between requests', async () => {
    const access = vi.fn(({ req }: { req: PayloadRequest }) => Boolean(req.user))
    const blocks: Record<string, Block> = {
      shared: {
        slug: 'shared',
        fields: [{ name: 'secret', type: 'text', access: { read: access } }],
      },
    }
    const denied = await run(args(references(2), blocks))
    const allowed = args(references(2), blocks)
    allowed.req.user = { id: 'user', collection: 'users' }
    const granted = await run(allowed)
    expect(access).toHaveBeenCalledTimes(4)
    expect(denied.field0).toMatchObject({
      blocks: { shared: { fields: { secret: { read: { permission: false } } } } },
    })
    expect(granted.field0).toMatchObject({
      blocks: { shared: { fields: { secret: { read: { permission: true } } } } },
    })
  })

  it('preserves asynchronous inherited permissions for shared access-free fields', async () => {
    const input = args(references(10), {
      shared: { slug: 'shared', fields: [{ name: 'text', type: 'text' }] },
    })
    input.parentPermissionsObject = {
      read: { permission: Promise.resolve(false) },
    } as unknown as Args['parentPermissionsObject']
    const output = await run(input)
    expect(output.field9).toMatchObject({
      blocks: { shared: { fields: { text: { read: { permission: false } } } } },
    })
  })

  it('recomputes when inherited permissions change within a traversal', async () => {
    const input = args([{ name: 'text', type: 'text' }])
    input.traversal = { hasAccess: new WeakMap(), visited: new WeakMap() }
    await run(input)
    input.parentPermissionsObject = { read: { permission: false } }
    expect(await run(input)).toMatchObject({ text: { read: { permission: false } } })
  })

  it('recomputes when the requested operations change', async () => {
    const input = args([{ name: 'text', type: 'text' }])
    input.traversal = { hasAccess: new WeakMap(), visited: new WeakMap() }
    input.operations = ['read']
    await run(input)
    input.operations = ['update']
    expect(await run(input)).toMatchObject({ text: { update: { permission: false } } })
  })

  it('does not confuse different field arrays targeting the same output', async () => {
    const input = args([{ name: 'first', type: 'text' }])
    input.traversal = { hasAccess: new WeakMap(), visited: new WeakMap() }
    await run(input)
    input.fields = [{ name: 'second', type: 'text' }]
    expect(await run(input)).toHaveProperty('second.read.permission', true)
  })

  it('retains missing-block handling', async () => {
    expect(await run(args(references(1)))).toMatchObject({ field0: { blocks: {} } })
  })
})
