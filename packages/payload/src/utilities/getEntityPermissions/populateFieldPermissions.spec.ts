import type { Block, Field } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it } from 'vitest'

import { populateFieldPermissions } from './populateFieldPermissions.js'

const createLeafBlock = (onAccess: () => void): Block => ({
  slug: 'leaf',
  fields: [
    {
      name: 'heading',
      type: 'text',
      access: {
        read: () => {
          onAccess()
          return true
        },
      },
    },
  ],
})

/**
 * Creates container blocks that each reference the leaf block, so the leaf block is used in many places
 */
const createContainerBlocks = (count: number): Block[] =>
  Array.from({ length: count }, (_, index) => ({
    slug: `container${index}`,
    fields: [{ name: 'children', type: 'blocks', blockReferences: ['leaf'], blocks: [] }],
  }))

const getPermissions = async ({ blocks, fields }: { blocks: Block[]; fields: Field[] }) => {
  const permissionsObject = {}
  const promises: Promise<void>[] = []

  populateFieldPermissions({
    blockReferencesPermissions: {},
    data: undefined,
    fields,
    operations: ['read'],
    parentPermissionsObject: { read: { permission: true } } as never,
    permissionsObject,
    promises,
    req: {
      payload: { blocks: Object.fromEntries(blocks.map((block) => [block.slug, block])) },
    } as unknown as PayloadRequest,
  })

  await Promise.all(promises)

  return permissionsObject
}

const countLeafAccessCalls = async (containerCount: number): Promise<number> => {
  let accessCallCount = 0
  const containers = createContainerBlocks(containerCount)

  await getPermissions({
    blocks: [createLeafBlock(() => accessCallCount++), ...containers],
    fields: [
      {
        name: 'layout',
        type: 'blocks',
        blockReferences: containers.map((block) => block.slug),
        blocks: [],
      },
    ],
  })

  return accessCallCount
}

describe('populateFieldPermissions', () => {
  it('should run the field access of a referenced block once, no matter how many places use it', async () => {
    expect(await countLeafAccessCalls(10)).toBe(await countLeafAccessCalls(1))
  })

  it('should populate a referenced block that is also used inside an earlier block of the same field', async () => {
    const containers = createContainerBlocks(1)

    // The container comes first, so the leaf block is cached inside the container
    // before the layout's own use of the leaf block is populated
    const permissions = await getPermissions({
      blocks: [createLeafBlock(() => {}), ...containers],
      fields: [
        { name: 'layout', type: 'blocks', blockReferences: ['container0', 'leaf'], blocks: [] },
      ],
    })

    expect(permissions).toMatchObject({
      layout: {
        blocks: {
          leaf: { fields: { heading: { read: { permission: true } } } },
        },
      },
    })
  })

  it('should resolve async field access of a referenced block in every place that uses it', async () => {
    const containers = createContainerBlocks(2)
    const leafBlock: Block = {
      slug: 'leaf',
      fields: [
        {
          name: 'heading',
          type: 'text',
          access: { read: () => new Promise((resolve) => setTimeout(() => resolve(true))) },
        },
      ],
    }

    const permissions = await getPermissions({
      blocks: [leafBlock, ...containers],
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blockReferences: containers.map((block) => block.slug),
          blocks: [],
        },
      ],
    })

    const leafInContainer = {
      fields: {
        children: {
          blocks: { leaf: { fields: { heading: { read: { permission: true } } } } },
        },
      },
    }

    expect(permissions).toMatchObject({
      layout: { blocks: { container0: leafInContainer, container1: leafInContainer } },
    })
  })
})
