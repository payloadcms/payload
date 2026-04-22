import { FlattenedField, PayloadRequest } from 'payload'

import type { FromCSVFunction, ToCSVFunction } from '../types.js'

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

describe('legacy toCSV / fromCSV argument shape', () => {
  describe('toCSV receives { columnName, data, doc, row, siblingDoc, value }', () => {
    it('should pass row as flat row accumulator, doc as top-level doc, and siblingDoc as source doc', () => {
      const received: Parameters<ToCSVFunction>[0][] = []

      const fields: FlattenedField[] = [
        {
          name: 'legacy',
          type: 'text',
          custom: {
            'plugin-import-export': {
              toCSV: ((args) => {
                received.push(args)
                args.row[`${args.columnName}_extra`] = 'added'
                return String(args.value) + '_transformed'
              }) satisfies ToCSVFunction,
            },
          },
        } as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })

      const doc = { legacy: 'hello', title: 'Top' }
      const result = flattenObject({
        data: doc,
        exportFieldHooks,
        format: 'csv',
      })

      expect(received).toHaveLength(1)
      const args = received[0]!
      expect(args.columnName).toBe('legacy')
      expect(args.value).toBe('hello')
      // doc should be the top-level document
      expect(args.doc).toBe(doc)
      // siblingDoc should be the source doc at the current nesting level (top-level == doc)
      expect(args.siblingDoc).toBe(doc)
      // row should be the flat row accumulator (a different object from doc)
      expect(args.row).not.toBe(doc)
      // data is kept as alias for row to avoid breaking legacy usage
      expect(args.data).toBe(args.row)

      expect(result.legacy).toBe('hello_transformed')
      expect(result.legacy_extra).toBe('added')
    })

    it('should not pass legacy args to hooks.beforeExport', () => {
      const received: Array<Record<string, unknown>> = []

      const fields: FlattenedField[] = [
        {
          name: 'modern',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: (args) => {
                  received.push(args as unknown as Record<string, unknown>)
                  return String(args.value) + '_modern'
                },
              },
            },
          },
        } as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })

      const doc = { modern: 'v', title: 'Top' }
      flattenObject({ data: doc, exportFieldHooks, format: 'csv' })

      expect(received).toHaveLength(1)
      const args = received[0]!
      // Modern signature: data === top-level doc
      expect(args.data).toBe(doc)
      // Modern signature: siblingData === flat row accumulator (not source doc)
      expect(args.siblingData).not.toBe(doc)
      expect(args.format).toBe('csv')
      // Legacy-only args should not be present
      expect(args.doc).toBeUndefined()
      expect(args.row).toBeUndefined()
      // `siblingDoc` is part of the modern signature too (read-only source view)
      expect(args.siblingDoc).toBeDefined()
    })

    it('should prefer hooks.beforeExport when both are defined on a field', () => {
      const legacyCalls: string[] = []
      const modernCalls: string[] = []

      const fields: FlattenedField[] = [
        {
          name: 'both',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: ({ value }) => {
                  modernCalls.push(String(value))
                  return `${value}_modern`
                },
              },
              toCSV: ({ value }: { value: unknown }) => {
                legacyCalls.push(String(value))
                return `${value}_legacy`
              },
            },
          },
        } as FlattenedField,
      ]

      const exportFieldHooks = getExportFieldFunctions({ fields })
      const result = flattenObject({
        data: { both: 'x' },
        exportFieldHooks,
        format: 'csv',
      })

      expect(modernCalls).toEqual(['x'])
      expect(legacyCalls).toEqual([])
      expect(result.both).toBe('x_modern')
    })
  })

  describe('fromCSV receives { columnName, data, value } with data as full flat row', () => {
    it('should pass the full flat row as data', () => {
      const received: Parameters<FromCSVFunction>[0][] = []

      const fields: FlattenedField[] = [
        {
          name: 'legacy',
          type: 'text',
          custom: {
            'plugin-import-export': {
              fromCSV: ((args) => {
                received.push(args)
                return String(args.value) + '_imported'
              }) satisfies FromCSVFunction,
            },
          },
        } as FlattenedField,
      ]

      const importFieldHooks = getImportFieldFunctions({ fields })

      const flatRow = { legacy: 'incoming', title: 'Top' }
      const result = unflattenObject({
        data: flatRow,
        fields,
        format: 'csv',
        importFieldHooks,
        req: mockReq,
      })

      expect(received).toHaveLength(1)
      expect(received[0]!.columnName).toBe('legacy')
      expect(received[0]!.value).toBe('incoming')
      // data should be the full flat row
      expect(received[0]!.data).toBe(flatRow)

      expect(result.legacy).toBe('incoming_imported')
    })

    it('should prefer hooks.beforeImport when both are defined on a field', () => {
      const legacyCalls: string[] = []
      const modernCalls: string[] = []

      const fields: FlattenedField[] = [
        {
          name: 'both',
          type: 'text',
          custom: {
            'plugin-import-export': {
              fromCSV: ({ value }: { value: unknown }) => {
                legacyCalls.push(String(value))
                return `${value}_legacy`
              },
              hooks: {
                beforeImport: ({ value }) => {
                  modernCalls.push(String(value))
                  return `${value}_modern`
                },
              },
            },
          },
        } as FlattenedField,
      ]

      const importFieldHooks = getImportFieldFunctions({ fields })
      const result = unflattenObject({
        data: { both: 'x' },
        fields,
        format: 'csv',
        importFieldHooks,
        req: mockReq,
      })

      expect(modernCalls).toEqual(['x'])
      expect(legacyCalls).toEqual([])
      expect(result.both).toBe('x_modern')
    })
  })
})
