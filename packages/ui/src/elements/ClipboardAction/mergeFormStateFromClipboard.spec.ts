import type { FormState } from 'payload'

import ObjectIdImport from 'bson-objectid'
import { describe, expect, it } from 'vitest'

import { mergeFormStateFromClipboard } from './mergeFormStateFromClipboard.js'
import type { ClipboardPasteData } from './types.js'

const ObjectId = (
  'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport
) as typeof ObjectIdImport

describe('mergeFormStateFromClipboard', () => {
  describe('block ID regeneration', () => {
    it('should generate new IDs when pasting blocks to prevent duplicates', () => {
      const copiedBlockID = new ObjectId().toHexString()

      const formState: FormState = {
        layout: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'blocks',
        path: 'layout',
        blocks: [],
        data: {
          'layout.0.id': {
            value: copiedBlockID,
            valid: true,
          },
          'layout.0.blockType': {
            value: 'content',
            valid: true,
          },
          'layout.0.text': {
            value: 'test content',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'layout',
      })

      // Check that a new ID was generated
      expect(result['layout.0.id']).toBeDefined()
      expect(result['layout.0.id'].value).toBeDefined()
      expect(result['layout.0.id'].value).not.toEqual(copiedBlockID)
      expect(ObjectId.isValid(result['layout.0.id'].value as string)).toBe(true)

      // Check that the row metadata also has the new ID
      expect(result.layout.rows).toHaveLength(1)
      expect(result.layout.rows?.[0]?.id).not.toEqual(copiedBlockID)
      expect(result.layout.rows?.[0]?.id).toEqual(result['layout.0.id'].value)
    })

    it('should generate new IDs for nested blocks', () => {
      const copiedBlockID = new ObjectId().toHexString()
      const copiedNestedBlockID = new ObjectId().toHexString()

      const formState: FormState = {
        layout: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'blocks',
        path: 'layout',
        blocks: [],
        data: {
          'layout.0.id': {
            value: copiedBlockID,
            valid: true,
          },
          'layout.0.blockType': {
            value: 'container',
            valid: true,
          },
          'layout.0.subBlocks': {
            value: 1,
            valid: true,
            rows: [{ id: copiedNestedBlockID }],
          },
          'layout.0.subBlocks.0.id': {
            value: copiedNestedBlockID,
            valid: true,
          },
          'layout.0.subBlocks.0.blockType': {
            value: 'content',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'layout',
      })

      // Check that parent block got new ID
      expect(result['layout.0.id'].value).not.toEqual(copiedBlockID)
      expect(ObjectId.isValid(result['layout.0.id'].value as string)).toBe(true)

      // Check that nested block got new ID
      expect(result['layout.0.subBlocks.0.id'].value).not.toEqual(copiedNestedBlockID)
      expect(ObjectId.isValid(result['layout.0.subBlocks.0.id'].value as string)).toBe(true)

      // Check that parent and nested IDs are different
      expect(result['layout.0.id'].value).not.toEqual(result['layout.0.subBlocks.0.id'].value)

      // Check that parent row metadata has new ID
      expect(result.layout.rows?.[0]?.id).toEqual(result['layout.0.id'].value)

      // Check that nested row metadata has new ID
      expect(result['layout.0.subBlocks'].rows?.[0]?.id).toEqual(
        result['layout.0.subBlocks.0.id'].value,
      )
    })

    it('should preserve non-ID field values when pasting', () => {
      const copiedBlockID = new ObjectId().toHexString()

      const formState: FormState = {
        layout: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'blocks',
        path: 'layout',
        blocks: [],
        data: {
          'layout.0.id': {
            value: copiedBlockID,
            valid: true,
          },
          'layout.0.blockType': {
            value: 'content',
            valid: true,
          },
          'layout.0.text': {
            value: 'preserved text content',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'layout',
      })

      // Non-ID fields should be preserved
      expect(result['layout.0.blockType'].value).toEqual('content')
      expect(result['layout.0.text'].value).toEqual('preserved text content')
    })

    it('should generate new ID when pasting from row to field', () => {
      const copiedBlockID = new ObjectId().toHexString()

      const formState: FormState = {
        duplicate: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      // Simulating copying from blocks.1 and pasting into duplicate field
      const clipboardData = {
        type: 'blocks' as const,
        path: 'blocks',
        blocks: [],
        data: {
          'blocks.1.id': {
            value: copiedBlockID,
            valid: true,
          },
          'blocks.1.blockType': {
            value: 'number',
            valid: true,
          },
          'blocks.1.number': {
            value: 342,
            valid: true,
          },
        },
        rowIndex: 1,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'duplicate',
      })

      // Check that a new ID was generated
      expect(result['duplicate.0.id']).toBeDefined()
      expect(result['duplicate.0.id'].value).toBeDefined()
      expect(result['duplicate.0.id'].value).not.toEqual(copiedBlockID)
      expect(ObjectId.isValid(result['duplicate.0.id'].value as string)).toBe(true)

      // Check that the row metadata has the new ID (not the copied ID)
      expect(result.duplicate.rows).toBeDefined()
      expect(result.duplicate.rows).toHaveLength(1)
      expect(result.duplicate.rows![0].id).not.toEqual(copiedBlockID)
      expect(result.duplicate.rows![0].id).toEqual(result['duplicate.0.id'].value)

      // Check that other fields were preserved
      expect(result['duplicate.0.number'].value).toEqual(342)
    })
  })
})
