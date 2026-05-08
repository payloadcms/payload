import { FlattenedField, PayloadRequest } from 'payload'

import type { FieldBeforeExportHook, FieldBeforeImportHook } from '../types.js'

import { applyFieldHooks } from './applyFieldHooks.js'
import { flattenObject } from './flattenObject.js'
import { getExportFieldFunctions } from './getExportFieldFunctions.js'
import { getImportFieldFunctions } from './getImportFieldFunctions.js'
import { unflattenObject } from './unflattenObject.js'

import { describe, expect, it, vi } from 'vitest'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

describe('beforeExport / beforeImport siblingDoc arg', () => {
  describe('CSV export (flattenObject)', () => {
    it('passes the source doc at the current nesting level as siblingDoc', () => {
      const received: Array<{
        columnName: string
        isSiblingDocSource: boolean
        isSiblingDocRow: boolean
      }> = []

      const fields: FlattenedField[] = [
        { name: 'title', type: 'text' } as FlattenedField,
        {
          name: 'group',
          type: 'group',
          flattenedFields: [
            {
              name: 'inner',
              type: 'text',
              custom: {
                'plugin-import-export': {
                  hooks: {
                    beforeExport: (({ columnName, siblingData, siblingDoc, value }) => {
                      received.push({
                        columnName,
                        isSiblingDocSource:
                          siblingDoc &&
                          typeof siblingDoc === 'object' &&
                          siblingDoc.inner === value,
                        isSiblingDocRow: siblingDoc === siblingData,
                      })
                      return value
                    }) satisfies FieldBeforeExportHook,
                  },
                },
              },
            },
          ],
        } as unknown as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })

      flattenObject({
        data: { group: { inner: 'deep' }, title: 'Top' },
        exportFieldHooks,
        format: 'csv',
        req: mockReq,
      })

      expect(received).toEqual([
        {
          columnName: 'group_inner',
          isSiblingDocSource: true,
          isSiblingDocRow: false,
        },
      ])
    })

    it('lets a hook read another sibling by reading siblingDoc', () => {
      const fields: FlattenedField[] = [
        { name: 'firstName', type: 'text' } as FlattenedField,
        {
          name: 'fullName',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: (({ siblingDoc, value }) => {
                  const last = siblingDoc.lastName as string | undefined
                  const first = siblingDoc.firstName as string | undefined
                  if (first && last) {
                    return `${first} ${last}`
                  }
                  return value
                }) satisfies FieldBeforeExportHook,
              },
            },
          },
        } as FlattenedField,
        { name: 'lastName', type: 'text' } as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })

      const result = flattenObject({
        data: { firstName: 'Ada', fullName: '(computed)', lastName: 'Lovelace' },
        exportFieldHooks,
        format: 'csv',
        req: mockReq,
      })

      expect(result.fullName).toBe('Ada Lovelace')
    })
  })

  describe('JSON export (applyFieldHooks)', () => {
    it('passes the untouched source sibling as siblingDoc and the mutable output as siblingData', () => {
      let capturedSiblingDoc: Record<string, unknown> | null = null
      let capturedSiblingData: Record<string, unknown> | null = null

      const fields: FlattenedField[] = [
        {
          name: 'outer',
          type: 'group',
          flattenedFields: [
            {
              name: 'tracked',
              type: 'text',
              custom: {
                'plugin-import-export': {
                  hooks: {
                    beforeExport: (({ siblingData, siblingDoc, value }) => {
                      capturedSiblingDoc = siblingDoc
                      capturedSiblingData = siblingData
                      siblingData.injected = 'written-into-output'
                      return String(value) + '_changed'
                    }) satisfies FieldBeforeExportHook,
                  },
                },
              },
            },
          ],
        } as unknown as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })

      const source = { outer: { tracked: 'original' } }

      applyFieldHooks({
        data: source,
        fieldHooks: exportFieldHooks,
        fields,
        format: 'json',
        operation: 'export',
        req: mockReq,
        type: 'beforeExport',
      })

      expect(capturedSiblingDoc).toEqual({ tracked: 'original' })
      // The hook's mutation lives on siblingData, not siblingDoc
      expect((capturedSiblingData as unknown as Record<string, unknown>)?.injected).toBe(
        'written-into-output',
      )
      expect((capturedSiblingDoc as unknown as Record<string, unknown>)?.injected).toBeUndefined()
      // And the source object itself is not mutated
      expect(source).toEqual({ outer: { tracked: 'original' } })
    })
  })

  describe('CSV import (unflattenObject)', () => {
    it('passes the full flat row as siblingDoc (equal to data)', () => {
      const received: Array<{ siblingDocIsData: boolean }> = []

      const fields: FlattenedField[] = [
        { name: 'title', type: 'text' } as FlattenedField,
        {
          name: 'note',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeImport: (({ data, siblingDoc, value }) => {
                  received.push({ siblingDocIsData: siblingDoc === data })
                  return value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        } as FlattenedField,
      ]

      const importFieldHooks = getImportFieldFunctions({ fields })

      unflattenObject({
        data: { note: 'hello', title: 'Top' },
        fields,
        format: 'csv',
        importFieldHooks,
        req: mockReq,
      })

      expect(received).toEqual([{ siblingDocIsData: true }])
    })
  })

  describe('JSON import (applyFieldHooks)', () => {
    it('passes the untouched source sibling as siblingDoc and the mutable output as siblingData', () => {
      let capturedSiblingDoc: Record<string, unknown> | null = null
      let capturedSiblingData: Record<string, unknown> | null = null

      const fields: FlattenedField[] = [
        {
          name: 'outer',
          type: 'group',
          flattenedFields: [
            {
              name: 'tracked',
              type: 'text',
              custom: {
                'plugin-import-export': {
                  hooks: {
                    beforeImport: (({ siblingData, siblingDoc, value }) => {
                      capturedSiblingDoc = siblingDoc
                      capturedSiblingData = siblingData
                      siblingData.injected = 'written-into-output'
                      return value
                    }) satisfies FieldBeforeImportHook,
                  },
                },
              },
            },
          ],
        } as unknown as FlattenedField,
      ]

      const importFieldHooks = getImportFieldFunctions({ fields })

      const source = { outer: { tracked: 'original' } }

      applyFieldHooks({
        data: source,
        fieldHooks: importFieldHooks,
        fields,
        format: 'json',
        operation: 'import',
        req: mockReq,
        type: 'beforeImport',
      })

      expect(capturedSiblingDoc).toEqual({ tracked: 'original' })
      expect((capturedSiblingData as unknown as Record<string, unknown>)?.injected).toBe(
        'written-into-output',
      )
      expect((capturedSiblingDoc as unknown as Record<string, unknown>)?.injected).toBeUndefined()
      expect(source).toEqual({ outer: { tracked: 'original' } })
    })
  })
})
