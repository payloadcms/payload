import type { Payload, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { buildFieldSchemaMap } from '../../packages/ui/src/utilities/buildFieldSchemaMap/index.js'
import { initPayloadInt } from '../helpers/shared/initPayloadInt.js'
import { fieldPathsSlug } from './shared.js'
import { testDoc } from './testDoc.js'

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
          indexPath: [],
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeChange_FieldPaths`]: {
          indexPath: [],
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_afterRead_FieldPaths`]: {
          indexPath: [],
          path,
          schemaPath,
        },
        [`${fieldIdentifier}_beforeDuplicate_FieldPaths`]: {
          indexPath: [],
          path,
          schemaPath,
        },
      })

      const originalDoc = await payload.create({
        collection: fieldPathsSlug,
        data: testDoc,
      })

      // duplicate the doc to ensure that the beforeDuplicate hook is run
      const doc = await payload.duplicate({
        id: originalDoc.id,
        collection: fieldPathsSlug,
      })

      const expectedDoc = {
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        id: doc.id,
        topLevelNamedField: doc.topLevelNamedField,
        fieldWithinRow: doc.fieldWithinRow,
        namedTab: doc.namedTab,
        fieldWithinUnnamedTab: doc.fieldWithinUnnamedTab,
        fieldWithinNestedUnnamedTab: doc.fieldWithinNestedUnnamedTab,
        array: doc.array,
        namedTabWithinCollapsible: doc.namedTabWithinCollapsible,
        fieldWithinUnnamedTabWithinCollapsible: doc.fieldWithinUnnamedTabWithinCollapsible,
        textFieldInUnnamedGroup: doc.textFieldInUnnamedGroup,
        blocks: doc.blocks,
        _status: doc._status,
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
        ...formatExpectedFieldPaths('fieldWithinUnnamedTabWithinCollapsible', {
          path: ['fieldWithinUnnamedTabWithinCollapsible'],
          schemaPath: ['_index-4-0-0', 'fieldWithinUnnamedTabWithinCollapsible'],
        }),
        ...formatExpectedFieldPaths('fieldWithinNamedTabWithinCollapsible', {
          path: ['namedTabWithinCollapsible', 'fieldWithinNamedTabWithinCollapsible'],
          schemaPath: [
            '_index-4-0',
            'namedTabWithinCollapsible',
            'fieldWithinNamedTabWithinCollapsible',
          ],
        }),
        ...formatExpectedFieldPaths('textFieldInUnnamedGroup', {
          path: ['textFieldInUnnamedGroup'],
          schemaPath: ['_index-5', 'textFieldInUnnamedGroup'],
        }),
        ...formatExpectedFieldPaths('textInCollapsibleInCollapsibleBlock', {
          path: ['blocks', '0', 'textInCollapsibleInCollapsibleBlock'],
          schemaPath: [
            'blocks',
            'CollapsibleBlock',
            '_index-0-0',
            'textInCollapsibleInCollapsibleBlock',
          ],
        }),
      }

      expect(doc).toEqual(expectedDoc)
    })
  })

  describe('field schema map', () => {
    it('should build a field schema map with correct field schema paths', async () => {
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
        'array._index-2.fieldWithinRowWithinArray',
        'array.id',
        '_index-2',
        '_index-2.fieldWithinRow',
        '_index-3',
        '_index-3-0',
        '_index-3-0.fieldWithinUnnamedTab',
        '_index-3-0-1',
        '_index-3-0-1-0',
        '_index-3-0-1-0.fieldWithinNestedUnnamedTab',
        '_index-3.namedTab',
        '_index-3.namedTab.fieldWithinNamedTab',
        '_index-4',
        '_index-4-0',
        '_index-4-0-0',
        '_index-4-0-0.fieldWithinUnnamedTabWithinCollapsible',
        '_index-4-0.namedTabWithinCollapsible',
        '_index-4-0.namedTabWithinCollapsible.fieldWithinNamedTabWithinCollapsible',
        '_index-5',
        '_index-5.textFieldInUnnamedGroup',
        'blocks',
        'blocks.CollapsibleBlock',
        'blocks.CollapsibleBlock._index-0',
        'blocks.CollapsibleBlock._index-0-0',
        'blocks.CollapsibleBlock._index-0-0.textInCollapsibleInCollapsibleBlock',
        'blocks.CollapsibleBlock.id',
        'blocks.CollapsibleBlock.blockName',
        'updatedAt',
        'createdAt',
        '_status',
      ])
    })
  })
})
