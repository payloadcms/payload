import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'
import type { Field } from '../../config/types.js'

import { beforeValidate } from './index.js'

describe('beforeValidate', () => {
  it('should apply the selected field access policy while hooks receive validate', async () => {
    const hookOperations: string[] = []
    const accessOperations: string[] = []
    const data = { title: 'restricted' }

    await beforeValidate({
      accessOperation: 'update',
      collection: {
        fields: [
          {
            access: {
              update: () => {
                accessOperations.push('update')
                return false
              },
            },
            hooks: {
              beforeValidate: [
                ({ operation }) => {
                  hookOperations.push(operation!)
                },
              ],
            },
            name: 'title',
            type: 'text',
          } as Field,
        ],
      } as any,
      context: {},
      data,
      doc: {},
      global: null,
      operation: 'validate',
      overrideAccess: false,
      req: { payload: {} } as PayloadRequest,
    })

    expect(hookOperations).toEqual(['validate'])
    expect(accessOperations).toEqual(['update'])
    expect(data).toEqual({})
  })
})
