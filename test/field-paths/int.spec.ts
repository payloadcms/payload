import type { Payload, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { buildFieldSchemaMap } from '../../packages/ui/src/utilities/buildFieldSchemaMap/index.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { fieldPathsSlug } from './shared.js'

let payload: Payload
let config: SanitizedConfig

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Field Paths', () => {
  beforeAll(async () => {
    const initResult = await initPayloadInt(dirname)
    config = initResult.config
    payload = initResult.payload
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('hooks', () => {
    it('should pass correct field paths through field hooks', async () => {
      const formatExpectedFieldPaths = (
        fieldIdentifier: string,
        {
          path,
          schemaPath,
        }: {
          path: string[]
          schemaPath: string[]
        },
      ) => ({
        [`${fieldIdentifier}_beforeValidate_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeChange_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_afterRead_FieldPaths`]: {
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeDuplicate_FieldPaths`]: {
          path,
          schemaPath,
        },
      })

      const originalDoc = await payload.create({
        collection: fieldPathsSlug,
        data: {
          topLevelNamedField: 'Test',
          array: [
            {
              fieldWithinArray: 'Test',
              nestedArray: [
                {
                  fieldWithinNestedArray: 'Test',
                  fieldWithinNestedRow: 'Test',
                },
              ],
            },
          ],
          fieldWithinRow: 'Test',
          fieldWithinUnnamedTab: 'Test',
          namedTab: {
            fieldWithinNamedTab: 'Test',
          },
          fieldWithinNestedUnnamedTab: 'Test',
        },
      })

      // duplicate the doc to ensure that the beforeDuplicate hook is run
      const doc = await payload.duplicate({
        id: originalDoc.id,
        collection: fieldPathsSlug,
      })

      expect(doc).toMatchObject({
        ...formatExpectedFieldPaths('topLevelNamedField', {
          path: ['topLevelNamedField'],
          schemaPath: ['topLevelNamedField'],
        }),
        ...formatExpectedFieldPaths('fieldWithinArray', {
          path: ['array', '0', 'fieldWithinArray'],
          schemaPath: ['array', 'fieldWithinArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNestedArray', {
          path: ['array', '0', 'nestedArray', '0', 'fieldWithinNestedArray'],
          schemaPath: ['array', 'nestedArray', 'fieldWithinNestedArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinRowWithinArray', {
          path: ['array', '0', 'fieldWithinRowWithinArray'],
          schemaPath: ['array', '_index-2', 'fieldWithinRowWithinArray'],
        }),
        ...formatExpectedFieldPaths('fieldWithinRow', {
          path: ['fieldWithinRow'],
          schemaPath: ['_index-2', 'fieldWithinRow'],
        }),
        ...formatExpectedFieldPaths('fieldWithinUnnamedTab', {
          path: ['fieldWithinUnnamedTab'],
          schemaPath: ['_index-3-0', 'fieldWithinUnnamedTab'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNestedUnnamedTab', {
          path: ['fieldWithinNestedUnnamedTab'],
          schemaPath: ['_index-3-0-1-0', 'fieldWithinNestedUnnamedTab'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNamedTab', {
          path: ['namedTab', 'fieldWithinNamedTab'],
          schemaPath: ['_index-3', 'namedTab', 'fieldWithinNamedTab'],
        }),
      })
    })
  })

  describe('field schema map', () => {
    it('should build a field schema map with correct field paths', async () => {
      const i18n = await initI18n({
        config: config.i18n,
        context: 'client',
        language: 'en',
      })

      const { fieldSchemaMap } = buildFieldSchemaMap({
        collectionSlug: fieldPathsSlug,
        config,
        i18n,
      })

      const fieldSchemaKeys: string[] = []

      fieldSchemaMap.forEach((value, key) => {
        if (key === fieldPathsSlug || key.endsWith('_FieldPaths')) {
          return
        }

        fieldSchemaKeys.push(key.replace(`${fieldPathsSlug}.`, ''))
      })

      expect(fieldSchemaKeys).toEqual([
        'topLevelNamedField',
        'array',
        'array.fieldWithinArray',
        'array.nestedArray',
        'array.nestedArray.fieldWithinNestedArray',
        'array.nestedArray.id',
        'array._index-2',
        'array._index-2.fieldWithinRowWithinArray', // THIS ONE IS WRONG!
        'array.id',
        '_index-2',
        '_index-2.fieldWithinRow', // THIS ONE IS WRONG!
        '_index-3',
        '_index-3-0',
        '_index-3-0.fieldWithinUnnamedTab', // THIS ONE IS WRONG!
        '_index-3-0-1',
        '_index-3-0-1-0',
        '_index-3-0-1-0.fieldWithinNestedUnnamedTab', // THIS ONE IS WRONG
        '_index-3.namedTab', // THIS ONE IS WRONG!
        '_index-3.namedTab.fieldWithinNamedTab', // THIS ONE IS WRONG!
        'updatedAt',
        'createdAt',
      ])
    })
  })
})
