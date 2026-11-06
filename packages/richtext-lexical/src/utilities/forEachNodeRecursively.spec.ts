import type { SerializedLexicalNode } from 'lexical'

import { describe, expect, it } from 'vitest'

import { recurseNodes, recurseNodesAsync } from './forEachNodeRecursively.js'

const slottedUpload = {
  relationTo: 'media',
  type: 'upload',
  value: 854,
  version: 1,
} as unknown as SerializedLexicalNode

const slotHost = {
  $slots: {
    column1: {
      children: [slottedUpload],
      type: 'column',
      version: 1,
    },
  },
  children: [],
  type: 'columns',
  version: 1,
} as unknown as SerializedLexicalNode

function collectTypes(nodes: SerializedLexicalNode[]): string[] {
  const visited: string[] = []
  recurseNodes({
    callback: (node) => {
      visited.push(node.type)
    },
    nodes,
  })
  return visited
}

async function collectTypesAsync(nodes: SerializedLexicalNode[]): Promise<string[]> {
  const visited: string[] = []
  await recurseNodesAsync({
    callback: async (node) => {
      visited.push(node.type)
    },
    nodes,
  })
  return visited
}

describe('recurseNodes', () => {
  it('should visit nodes stored in named slots ($slots)', () => {
    expect(collectTypes([slotHost])).toEqual(['columns', 'column', 'upload'])
  })

  it('should visit nodes in slots nested inside slots', () => {
    const nestedHost = {
      $slots: {
        outer: {
          $slots: {
            inner: slottedUpload,
          },
          children: [],
          type: 'slot-host',
          version: 1,
        },
      },
      children: [],
      type: 'columns',
      version: 1,
    } as unknown as SerializedLexicalNode

    expect(collectTypes([nestedHost])).toEqual(['columns', 'slot-host', 'upload'])
  })

  it('should still visit children', () => {
    const paragraph = {
      children: [{ text: 'hello', type: 'text', version: 1 }],
      type: 'paragraph',
      version: 1,
    } as unknown as SerializedLexicalNode

    expect(collectTypes([paragraph])).toEqual(['paragraph', 'text'])
  })

  it('should ignore non-object slot values', () => {
    const hostWithJunkSlots = {
      $slots: {
        a: 'not-a-node',
        b: null,
        c: 42,
      },
      children: [],
      type: 'columns',
      version: 1,
    } as unknown as SerializedLexicalNode

    expect(collectTypes([hostWithJunkSlots])).toEqual(['columns'])
  })

  it('should visit both children and slots of the same node', () => {
    const mixedHost = {
      $slots: {
        column1: slottedUpload,
      },
      children: [{ text: 'hello', type: 'text', version: 1 }],
      type: 'columns',
      version: 1,
    } as unknown as SerializedLexicalNode

    expect(collectTypes([mixedHost])).toEqual(['columns', 'text', 'upload'])
  })
})

describe('recurseNodesAsync', () => {
  it('should visit nodes stored in named slots ($slots)', async () => {
    expect(await collectTypesAsync([slotHost])).toEqual(['columns', 'column', 'upload'])
  })

  it('should still visit children', async () => {
    const paragraph = {
      children: [{ text: 'hello', type: 'text', version: 1 }],
      type: 'paragraph',
      version: 1,
    } as unknown as SerializedLexicalNode

    expect(await collectTypesAsync([paragraph])).toEqual(['paragraph', 'text'])
  })
})
