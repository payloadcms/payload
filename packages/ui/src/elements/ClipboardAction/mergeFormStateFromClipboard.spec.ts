import type { FormState } from 'payload'

import ObjectIdImport from 'bson-objectid'
import { describe, expect, it } from 'vitest'

import {
  mergeFormStateFromClipboard,
  reduceFormStateByPath,
} from './mergeFormStateFromClipboard.js'
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

  describe('block row paste with nested array', () => {
    it('should regenerate nested array item IDs when pasting a block row', () => {
      const copiedBlockID = new ObjectId().toHexString()
      const copiedArrayItemID1 = new ObjectId().toHexString()
      const copiedArrayItemID2 = new ObjectId().toHexString()
      const copiedArrayItemID3 = new ObjectId().toHexString()
      const targetBlockID = new ObjectId().toHexString()

      // Target form state: block at index 1 with empty buttons array
      const formState: FormState = {
        ctas: {
          valid: true,
          value: 2,
          initialValue: 2,
          rows: [
            { id: copiedBlockID, blockType: 'callToAction', isLoading: false },
            { id: targetBlockID, blockType: 'callToAction', isLoading: false },
          ],
        },
        'ctas.0': { value: 'callToAction', valid: true },
        'ctas.0.id': { value: copiedBlockID, valid: true },
        'ctas.0.buttons': {
          valid: true,
          value: 3,
          rows: [
            { id: copiedArrayItemID1, isLoading: false },
            { id: copiedArrayItemID2, isLoading: false },
            { id: copiedArrayItemID3, isLoading: false },
          ],
        },
        'ctas.0.buttons.0.id': { value: copiedArrayItemID1, valid: true },
        'ctas.0.buttons.1.id': { value: copiedArrayItemID2, valid: true },
        'ctas.0.buttons.2.id': { value: copiedArrayItemID3, valid: true },
        'ctas.1': { value: 'callToAction', valid: true },
        'ctas.1.id': { value: targetBlockID, valid: true },
        'ctas.1.buttons': {
          valid: true,
          value: 0,
          rows: [],
        },
      }

      // Clipboard: block row 0 (source) with 3 buttons
      const clipboardData: ClipboardPasteData = {
        type: 'blocks',
        path: 'ctas',
        blocks: [],
        rowIndex: 0,
        data: {
          'ctas.0': { value: 'callToAction', valid: true },
          'ctas.0.id': { value: copiedBlockID, valid: true },
          'ctas.0.buttons': {
            valid: true,
            value: 3,
            rows: [
              { id: copiedArrayItemID1, isLoading: false },
              { id: copiedArrayItemID2, isLoading: false },
              { id: copiedArrayItemID3, isLoading: false },
            ],
          },
          'ctas.0.buttons.0.id': { value: copiedArrayItemID1, valid: true },
          'ctas.0.buttons.0.label': { value: 'Button 1', valid: true },
          'ctas.0.buttons.1.id': { value: copiedArrayItemID2, valid: true },
          'ctas.0.buttons.1.label': { value: 'Button 2', valid: true },
          'ctas.0.buttons.2.id': { value: copiedArrayItemID3, valid: true },
          'ctas.0.buttons.2.label': { value: 'Button 3', valid: true },
        },
      }

      // Paste into block row 1 (target)
      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'ctas',
        rowIndex: 1,
      })

      // Target block ID should NOT be overwritten
      expect(result['ctas.1.id'].value).toEqual(targetBlockID)

      // Nested array items should have NEW IDs (not the source IDs)
      expect(result['ctas.1.buttons.0.id']).toBeDefined()
      expect(result['ctas.1.buttons.0.id'].value).not.toEqual(copiedArrayItemID1)
      expect(ObjectId.isValid(result['ctas.1.buttons.0.id'].value as string)).toBe(true)

      expect(result['ctas.1.buttons.1.id']).toBeDefined()
      expect(result['ctas.1.buttons.1.id'].value).not.toEqual(copiedArrayItemID2)

      expect(result['ctas.1.buttons.2.id']).toBeDefined()
      expect(result['ctas.1.buttons.2.id'].value).not.toEqual(copiedArrayItemID3)

      // The rows metadata in ctas.1.buttons should have the new IDs
      expect(result['ctas.1.buttons'].rows).toHaveLength(3)
      expect(result['ctas.1.buttons'].rows![0].id).toEqual(result['ctas.1.buttons.0.id'].value)
      expect(result['ctas.1.buttons'].rows![1].id).toEqual(result['ctas.1.buttons.1.id'].value)
      expect(result['ctas.1.buttons'].rows![2].id).toEqual(result['ctas.1.buttons.2.id'].value)

      // Field values should be copied
      expect(result['ctas.1.buttons.0.label'].value).toEqual('Button 1')
      expect(result['ctas.1.buttons.1.label'].value).toEqual('Button 2')
      expect(result['ctas.1.buttons.2.label'].value).toEqual('Button 3')

      // Source block should be untouched
      expect(result['ctas.0.id'].value).toEqual(copiedBlockID)
      expect(result['ctas.0.buttons'].rows).toHaveLength(3)
    })
  })

  describe('array ID regeneration', () => {
    it('should generate new IDs when pasting arrays to prevent duplicates', () => {
      const copiedArrayID = new ObjectId().toHexString()

      const formState: FormState = {
        items: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'array',
        path: 'items',
        fields: [],
        data: {
          'items.0.id': {
            value: copiedArrayID,
            valid: true,
          },
          'items.0.text': {
            value: 'test content',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'items',
      })

      // Check that a new ID was generated
      expect(result['items.0.id']).toBeDefined()
      expect(result['items.0.id'].value).toBeDefined()
      expect(result['items.0.id'].value).not.toEqual(copiedArrayID)
      expect(ObjectId.isValid(result['items.0.id'].value as string)).toBe(true)

      // Check that the row metadata also has the new ID
      expect(result.items.rows).toHaveLength(1)
      expect(result.items.rows?.[0]?.id).not.toEqual(copiedArrayID)
      expect(result.items.rows?.[0]?.id).toEqual(result['items.0.id'].value)
    })

    it('should generate new IDs for nested arrays', () => {
      const copiedArrayID = new ObjectId().toHexString()
      const copiedNestedArrayID = new ObjectId().toHexString()

      const formState: FormState = {
        items: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'array',
        path: 'items',
        fields: [],
        data: {
          'items.0.id': {
            value: copiedArrayID,
            valid: true,
          },
          'items.0.text': {
            value: 'parent array',
            valid: true,
          },
          'items.0.subArray': {
            value: 1,
            valid: true,
            rows: [{ id: copiedNestedArrayID }],
          },
          'items.0.subArray.0.id': {
            value: copiedNestedArrayID,
            valid: true,
          },
          'items.0.subArray.0.text': {
            value: 'nested array',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'items',
      })

      // Check that parent array got new ID
      expect(result['items.0.id'].value).not.toEqual(copiedArrayID)
      expect(ObjectId.isValid(result['items.0.id'].value as string)).toBe(true)

      // Check that nested array got new ID
      expect(result['items.0.subArray.0.id'].value).not.toEqual(copiedNestedArrayID)
      expect(ObjectId.isValid(result['items.0.subArray.0.id'].value as string)).toBe(true)

      // Check that parent and nested IDs are different
      expect(result['items.0.id'].value).not.toEqual(result['items.0.subArray.0.id'].value)

      // Check that parent row metadata has new ID
      expect(result.items.rows?.[0]?.id).toEqual(result['items.0.id'].value)

      // Check that nested row metadata has new ID
      expect(result['items.0.subArray'].rows?.[0]?.id).toEqual(
        result['items.0.subArray.0.id'].value,
      )
    })

    it('should preserve non-ID field values when pasting arrays', () => {
      const copiedArrayID = new ObjectId().toHexString()

      const formState: FormState = {
        items: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      const clipboardData: ClipboardPasteData = {
        type: 'array',
        path: 'items',
        fields: [],
        data: {
          'items.0.id': {
            value: copiedArrayID,
            valid: true,
          },
          'items.0.text': {
            value: 'preserved array text',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'items',
      })

      // Non-ID fields should be preserved
      expect(result['items.0.text'].value).toEqual('preserved array text')
    })

    it('should generate new ID when pasting from array row to field', () => {
      const copiedArrayID = new ObjectId().toHexString()

      const formState: FormState = {
        disableSort: {
          valid: true,
          value: 0,
          initialValue: 0,
          rows: [],
        },
      }

      // Simulating copying from items.0 and pasting into disableSort field
      const clipboardData = {
        type: 'array' as const,
        path: 'items',
        fields: [],
        data: {
          'items.0.id': {
            value: copiedArrayID,
            valid: true,
          },
          'items.0.text': {
            value: 'row one',
            valid: true,
          },
        },
        rowIndex: 0,
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'disableSort',
      })

      // Check that a new ID was generated
      expect(result['disableSort.0.id']).toBeDefined()
      expect(result['disableSort.0.id'].value).toBeDefined()
      expect(result['disableSort.0.id'].value).not.toEqual(copiedArrayID)
      expect(ObjectId.isValid(result['disableSort.0.id'].value as string)).toBe(true)

      // Check that the row metadata has the new ID (not the copied ID)
      expect(result.disableSort.rows).toBeDefined()
      expect(result.disableSort.rows).toHaveLength(1)
      expect(result.disableSort.rows![0].id).not.toEqual(copiedArrayID)
      expect(result.disableSort.rows![0].id).toEqual(result['disableSort.0.id'].value)

      // Check that other fields were preserved
      expect(result['disableSort.0.text'].value).toEqual('row one')
    })
  })

  describe('prefix collision with multi-digit sibling indices', () => {
    it('reduceFormStateByPath should not leak siblings whose indices share a digit prefix', () => {
      // Array with 13 rows. Copying row 1 must filter out rows 10/11/12, whose
      // paths all begin with the substring `children.1`.
      const formState: FormState = {
        children: {
          valid: true,
          value: 13,
          rows: Array.from({ length: 13 }, () => ({ isLoading: false })),
        },
        'children.1.id': { value: 'id-1', valid: true },
        'children.1.title': { value: 'Row 1', valid: true },
        'children.10.id': { value: 'id-10', valid: true },
        'children.10.title': { value: 'Row 10', valid: true },
        'children.11.id': { value: 'id-11', valid: true },
        'children.11.title': { value: 'Row 11', valid: true },
        'children.12.id': { value: 'id-12', valid: true },
        'children.12.title': { value: 'Row 12', valid: true },
      }

      const filtered = reduceFormStateByPath({
        formState,
        path: 'children',
        rowIndex: 1,
      })

      const filteredKeys = Object.keys(filtered).sort()
      expect(filteredKeys).toEqual(['children.1.id', 'children.1.title'])
      expect(filtered['children.10.id']).toBeUndefined()
      expect(filtered['children.11.id']).toBeUndefined()
      expect(filtered['children.12.id']).toBeUndefined()
    })

    it('reduceFormStateByPath should not leak field-name siblings sharing a textual prefix', () => {
      // `children` vs `childrenOther`: loose prefix matching pulls the wrong field's state.
      const formState: FormState = {
        children: { valid: true, value: 1, rows: [{ isLoading: false }] },
        'children.0.id': { value: 'children-row', valid: true },
        childrenOther: { valid: true, value: 1, rows: [{ isLoading: false }] },
        'childrenOther.0.id': { value: 'other-row', valid: true },
      }

      const filtered = reduceFormStateByPath({ formState, path: 'children' })

      expect(filtered['children.0.id']).toBeDefined()
      expect(filtered.childrenOther).toBeUndefined()
      expect(filtered['childrenOther.0.id']).toBeUndefined()
    })

    it('paste should not create out-of-bounds rows from a leaked clipboard payload', () => {
      // Simulates the end-to-end Copy/Paste flow against an array with 13 rows. Even if a
      // pre-fix clipboard leaked sibling rows (.10/.11/.12) when copying row 1, the merge
      // filter must drop them rather than rewriting them to .50/.51/.52 when pasting into
      // row 5.
      const formState: FormState = {
        children: {
          valid: true,
          value: 13,
          rows: Array.from({ length: 13 }, () => ({
            id: new ObjectId().toHexString(),
            isLoading: false,
          })),
        },
        'children.5.id': { value: new ObjectId().toHexString(), valid: true },
      }

      const sourceID = new ObjectId().toHexString()
      const clipboardData: ClipboardPasteData = {
        type: 'array',
        path: 'children',
        fields: [],
        rowIndex: 1,
        data: {
          'children.1.id': { value: sourceID, valid: true },
          'children.1.title': { value: 'Row 1 title', valid: true },
          // Leaked siblings — these must be dropped, not rewritten to .50/.51/.52.
          'children.10.id': { value: new ObjectId().toHexString(), valid: true },
          'children.10.title': { value: 'Leaked Row 10', valid: true },
          'children.11.id': { value: new ObjectId().toHexString(), valid: true },
          'children.11.title': { value: 'Leaked Row 11', valid: true },
          'children.12.id': { value: new ObjectId().toHexString(), valid: true },
          'children.12.title': { value: 'Leaked Row 12', valid: true },
        },
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'children',
        rowIndex: 5,
      })

      // Target row populated from the source row.
      expect(result['children.5.title'].value).toEqual('Row 1 title')

      // No phantom out-of-bounds rows. These would correspond to `.10`/`.11`/`.12` being
      // rewritten through `String.replace('children.1', 'children.5')`.
      expect(result['children.50']).toBeUndefined()
      expect(result['children.51']).toBeUndefined()
      expect(result['children.52']).toBeUndefined()
      expect(result['children.50.id']).toBeUndefined()
      expect(result['children.51.id']).toBeUndefined()
      expect(result['children.52.id']).toBeUndefined()
      expect(result['children.50.title']).toBeUndefined()
      expect(result['children.51.title']).toBeUndefined()
      expect(result['children.52.title']).toBeUndefined()
    })

    it('row-to-field cleanup should not delete unrelated fields with a textual prefix collision', () => {
      // `path` = 'children', `lastRenderedPath` = 'children.0'. A sibling field
      // `childrenOther.0.title` must NOT be deleted by the cleanup loop.
      const formState: FormState = {
        children: { valid: true, value: 0, rows: [{ isLoading: false }] },
        'children.0.id': { value: new ObjectId().toHexString(), valid: true },
        childrenOther: { valid: true, value: 1, rows: [{ isLoading: false }] },
        'childrenOther.0.id': { value: new ObjectId().toHexString(), valid: true },
        'childrenOther.0.title': { value: 'Unrelated field', valid: true },
      }

      const sourceID = new ObjectId().toHexString()
      const clipboardData: ClipboardPasteData = {
        type: 'array',
        path: 'someOtherArray',
        fields: [],
        rowIndex: 0,
        data: {
          'someOtherArray.0.id': { value: sourceID, valid: true },
          'someOtherArray.0.title': { value: 'Pasted row', valid: true },
        },
      }

      const result = mergeFormStateFromClipboard({
        dataFromClipboard: clipboardData,
        formState,
        path: 'children',
      })

      // Unrelated `childrenOther.*` paths survive the cleanup.
      expect(result.childrenOther).toBeDefined()
      expect(result['childrenOther.0.id']).toBeDefined()
      expect(result['childrenOther.0.title']?.value).toEqual('Unrelated field')
    })
  })
})
