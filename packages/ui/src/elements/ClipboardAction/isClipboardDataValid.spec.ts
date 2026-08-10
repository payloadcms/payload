import type { ClientBlock, ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import type { ClipboardPasteActionValidateArgs, ClipboardPasteData } from './types.js'

import { isClipboardDataValid } from './isClipboardDataValid.js'

const textField = { name: 'text', type: 'text' } as ClientField
const numberField = { name: 'num', type: 'number' } as ClientField
const renamedTextField = { name: 'title', type: 'text' } as ClientField

const subArrayField = { name: 'sub', type: 'array', fields: [textField] } as ClientField
const subArrayFieldMismatch = { name: 'sub', type: 'array', fields: [numberField] } as ClientField

const ctaBlock = { slug: 'cta', fields: [textField] } as ClientBlock
const otherBlock = { slug: 'other', fields: [numberField] } as ClientBlock

const baseData: ClipboardPasteData['data'] = { 'items.0.text': { valid: true, value: 'hi' } }

const buildArrayArgs = ({
  fields,
  schemaFields,
  ...overrides
}: {
  fields: ClientField[]
  schemaFields: ClientField[]
} & Partial<ClipboardPasteActionValidateArgs>): ClipboardPasteActionValidateArgs =>
  ({
    type: 'array',
    data: baseData,
    fieldPath: 'items',
    fields,
    path: 'items',
    rowIndex: 0,
    schemaFields,
    ...overrides,
  }) as ClipboardPasteActionValidateArgs

const buildBlocksArgs = ({
  blocks,
  schemaBlocks,
}: {
  blocks: ClientBlock[]
  schemaBlocks: ClientBlock[]
}): ClipboardPasteActionValidateArgs =>
  ({
    type: 'blocks',
    blocks,
    data: { 'layout.0.blockType': { valid: true, value: 'cta' } },
    fieldPath: 'layout',
    path: 'layout',
    rowIndex: 0,
    schemaBlocks,
  }) as ClipboardPasteActionValidateArgs

describe('isClipboardDataValid', () => {
  it('should return false when data is undefined', () => {
    expect(
      isClipboardDataValid(
        buildArrayArgs({ data: undefined, fields: [textField], schemaFields: [textField] }),
      ),
    ).toBe(false)
  })

  it('should return false when path is missing', () => {
    expect(
      isClipboardDataValid(
        buildArrayArgs({ fields: [textField], path: '', schemaFields: [textField] }),
      ),
    ).toBe(false)
  })

  describe('array fields', () => {
    it('should return true for a matching schema', () => {
      expect(
        isClipboardDataValid(buildArrayArgs({ fields: [textField], schemaFields: [textField] })),
      ).toBe(true)
    })

    it('should return false when field types differ', () => {
      expect(
        isClipboardDataValid(buildArrayArgs({ fields: [textField], schemaFields: [numberField] })),
      ).toBe(false)
    })

    it('should return false when field names differ', () => {
      expect(
        isClipboardDataValid(
          buildArrayArgs({ fields: [textField], schemaFields: [renamedTextField] }),
        ),
      ).toBe(false)
    })

    it('should return false when field counts differ', () => {
      expect(
        isClipboardDataValid(
          buildArrayArgs({ fields: [textField], schemaFields: [textField, numberField] }),
        ),
      ).toBe(false)
    })

    it('should return true for matching nested sub-fields', () => {
      expect(
        isClipboardDataValid(
          buildArrayArgs({ fields: [subArrayField], schemaFields: [subArrayField] }),
        ),
      ).toBe(true)
    })

    it('should return false for mismatching nested sub-fields', () => {
      expect(
        isClipboardDataValid(
          buildArrayArgs({ fields: [subArrayField], schemaFields: [subArrayFieldMismatch] }),
        ),
      ).toBe(false)
    })
  })

  describe('blocks fields', () => {
    it('should return true for a matching block schema', () => {
      expect(
        isClipboardDataValid(buildBlocksArgs({ blocks: [ctaBlock], schemaBlocks: [ctaBlock] })),
      ).toBe(true)
    })

    it('should return false when a copied block slug is not in the target config', () => {
      expect(
        isClipboardDataValid(buildBlocksArgs({ blocks: [ctaBlock], schemaBlocks: [otherBlock] })),
      ).toBe(false)
    })

    it('should return false when the target has no blocks configured', () => {
      expect(isClipboardDataValid(buildBlocksArgs({ blocks: [ctaBlock], schemaBlocks: [] }))).toBe(
        false,
      )
    })
  })
})
