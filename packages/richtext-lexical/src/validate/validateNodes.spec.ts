import type { SerializedLexicalNode } from 'lexical'

import { describe, expect, it } from 'vitest'

import type { NodeValidation } from '../features/typesServer.js'
import { validateNodes } from './validateNodes.js'

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

const validationProps = {
  options: {},
  value: { root: slotHost },
} as unknown as Parameters<typeof validateNodes>[0]['validation']

const uploadValidation: NodeValidation = ({ node }) => {
  // An upload node whose value is still a raw id (not populated) is invalid
  if (typeof (node as { value?: unknown }).value === 'number') {
    return 'upload value was not populated'
  }
  return true
}

describe('validateNodes', () => {
  it('should fail validation for an invalid node inside a named slot ($slots)', async () => {
    const nodeValidations = new Map<string, Array<NodeValidation>>([['upload', [uploadValidation]]])

    const result = await validateNodes({
      nodes: [slotHost],
      nodeValidations,
      validation: validationProps,
    })

    expect(result).toBe('upload node failed to validate: upload value was not populated')
  })

  it('should still fail validation for an invalid node inside children', async () => {
    const nodeValidations = new Map<string, Array<NodeValidation>>([['upload', [uploadValidation]]])
    const paragraph = {
      children: [slottedUpload],
      type: 'paragraph',
      version: 1,
    } as unknown as SerializedLexicalNode

    const result = await validateNodes({
      nodes: [paragraph],
      nodeValidations,
      validation: validationProps,
    })

    expect(result).toBe('upload node failed to validate: upload value was not populated')
  })

  it('should pass validation when all nodes, including slotted ones, are valid', async () => {
    const populatedUpload = {
      relationTo: 'media',
      type: 'upload',
      value: { id: 'media-id' },
      version: 1,
    } as unknown as SerializedLexicalNode
    const validHost = {
      $slots: {
        column1: {
          children: [populatedUpload],
          type: 'column',
          version: 1,
        },
      },
      children: [],
      type: 'columns',
      version: 1,
    } as unknown as SerializedLexicalNode
    const nodeValidations = new Map<string, Array<NodeValidation>>([['upload', [uploadValidation]]])

    const result = await validateNodes({
      nodes: [validHost],
      nodeValidations,
      validation: validationProps,
    })

    expect(result).toBe(true)
  })
})
