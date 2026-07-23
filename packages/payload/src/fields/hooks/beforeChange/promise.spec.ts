import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'
import type { Field } from '../../config/types.js'

import { promise } from './promise.js'

const req = {
  i18n: {},
  locale: 'de',
  payload: {
    blocks: {},
    config: {},
  },
  t: (key: string) => key,
  user: null,
} as PayloadRequest

describe('beforeChange field traversal', () => {
  it('should add the active locale to ordinary field validation errors', async () => {
    const errors = []

    await promise({
      collection: null,
      context: {},
      data: { title: '' },
      doc: {},
      docWithLocales: {},
      errors,
      field: {
        name: 'title',
        type: 'text',
        validate: () => 'Title is required',
      } as Field,
      fieldIndex: 0,
      fieldLabelPath: '',
      global: null,
      mergeLocaleActions: [],
      operation: 'update',
      overrideAccess: false,
      parentIndexPath: '',
      parentIsLocalized: false,
      parentPath: '',
      parentSchemaPath: '',
      req,
      siblingData: { title: '' },
      siblingDoc: {},
      siblingDocWithLocales: {},
      skipValidation: false,
    })

    expect(errors).toEqual([
      {
        label: 'Title',
        locale: 'de',
        message: 'Title is required',
        path: 'title',
      },
    ])
  })

  it('should add the active locale to invalid block filter errors', async () => {
    const errors = []

    await promise({
      collection: null,
      context: {},
      data: { content: [{ blockType: 'restricted' }] },
      doc: {},
      docWithLocales: {},
      errors,
      field: {
        blocks: [
          {
            fields: [],
            labels: { plural: 'Restricted', singular: 'Restricted' },
            slug: 'restricted',
          },
        ],
        filterOptions: [],
        name: 'content',
        type: 'blocks',
        validate: () => 'Invalid block',
      } as Field,
      fieldIndex: 0,
      fieldLabelPath: '',
      global: null,
      mergeLocaleActions: [],
      operation: 'update',
      overrideAccess: false,
      parentIndexPath: '',
      parentIsLocalized: false,
      parentPath: '',
      parentSchemaPath: '',
      req,
      siblingData: { content: [{ blockType: 'restricted' }] },
      siblingDoc: {},
      siblingDocWithLocales: {},
      skipValidation: false,
    })

    expect(errors).toEqual([
      {
        label: 'Content > fields:block 1 (Restricted)',
        locale: 'de',
        message: 'validation:invalidBlock',
        path: 'content.0.id',
      },
    ])
  })
})
