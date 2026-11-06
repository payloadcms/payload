import type { SerializedLexicalNode } from 'lexical'

import { describe, expect, it } from 'vitest'

import { recurseNodeTree } from './recurseNodeTree.js'

const slottedUpload = {
  id: 'upload-node-id',
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

describe('recurseNodeTree', () => {
  it('should flatten nodes stored in named slots ($slots)', () => {
    const flattenedNodes: SerializedLexicalNode[] = []

    recurseNodeTree({ flattenedNodes, nodes: [slotHost] })

    expect(flattenedNodes.map((node) => node.type)).toEqual(['columns', 'column', 'upload'])
  })

  it('should index slotted nodes in nodeIDMap', () => {
    const flattenedNodes: SerializedLexicalNode[] = []
    const nodeIDMap: { [key: string]: SerializedLexicalNode } = {}

    recurseNodeTree({ flattenedNodes, nodeIDMap, nodes: [slotHost] })

    expect(nodeIDMap['upload-node-id']).toBe(slottedUpload)
  })

  it('should still flatten children', () => {
    const flattenedNodes: SerializedLexicalNode[] = []
    const paragraph = {
      children: [{ text: 'hello', type: 'text', version: 1 }],
      type: 'paragraph',
      version: 1,
    } as unknown as SerializedLexicalNode

    recurseNodeTree({ flattenedNodes, nodes: [paragraph] })

    expect(flattenedNodes.map((node) => node.type)).toEqual(['paragraph', 'text'])
  })
})
