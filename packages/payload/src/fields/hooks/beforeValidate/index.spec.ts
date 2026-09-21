import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field } from '../../config/types.js'

import { describe, expect, it } from 'vitest'

import { beforeValidate } from './index.js'

type FieldAccessResult = {
  accessResult: boolean
  path: string
}

const runBeforeValidate = async ({
  fields,
  overrideAccess = false,
}: {
  fields: Field[]
  overrideAccess?: boolean
}): Promise<FieldAccessResult[]> => {
  const fieldAccessResults: FieldAccessResult[] = []

  await beforeValidate({
    collection: { fields } as SanitizedCollectionConfig,
    context: {},
    data: Object.fromEntries(fields.map((field) => ['name' in field ? field.name : '', 'value'])),
    doc: {} as JsonObject,
    global: null,
    onFieldAccess: (fieldAccessResult) => {
      fieldAccessResults.push(fieldAccessResult)
    },
    operation: 'create',
    overrideAccess,
    req: { context: {}, payload: {} } as PayloadRequest,
  })

  return fieldAccessResults
}

describe('beforeValidate', () => {
  it('should apply the validate field access policy while hooks receive validate', async () => {
    const hookOperations: string[] = []
    const accessOperations: string[] = []
    const data = { title: 'restricted' }

    await beforeValidate({
      collection: {
        fields: [
          {
            access: {
              validate: ({ req }) => {
                accessOperations.push(req.operation!)
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
      } as SanitizedCollectionConfig,
      context: {},
      data,
      doc: {},
      global: null,
      operation: 'validate',
      overrideAccess: false,
      req: { context: {}, operation: 'validate', payload: {} } as PayloadRequest,
    })

    expect(hookOperations).toEqual(['validate'])
    expect(accessOperations).toEqual(['validate'])
    expect(data).toEqual({})
  })
})

describe('beforeValidate field access results', () => {
  it('should report explicit and implicit field access results', async () => {
    const fieldAccessResults = await runBeforeValidate({
      fields: [
        {
          name: 'explicitlyAllowed',
          type: 'text',
          access: { create: () => true },
        },
        {
          name: 'explicitlyDenied',
          type: 'text',
          access: { create: () => false },
        },
        {
          name: 'implicitlyAllowed',
          type: 'text',
        },
      ],
    })

    expect(fieldAccessResults).toHaveLength(3)
    expect(fieldAccessResults).toEqual(
      expect.arrayContaining([
        { accessResult: true, path: 'explicitlyAllowed' },
        { accessResult: false, path: 'explicitlyDenied' },
        { accessResult: true, path: 'implicitlyAllowed' },
      ]),
    )
  })

  it('should report access as allowed when access control is overridden', async () => {
    const fieldAccessResults = await runBeforeValidate({
      fields: [
        {
          name: 'overridden',
          type: 'text',
          access: { create: () => false },
        },
      ],
      overrideAccess: true,
    })

    expect(fieldAccessResults).toEqual([{ accessResult: true, path: 'overridden' }])
  })
})
