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
    req: { context: {}, payload: { config: { localization: false } } } as PayloadRequest,
  })

  return fieldAccessResults
}

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

describe('beforeValidate all-locale publication', () => {
  const runPublication = async ({
    access,
    hooks,
  }: {
    access?: Field['access']
    hooks?: Field['hooks']
  } = {}) => {
    const fieldAccessResults: FieldAccessResult[] = []
    const result = await beforeValidate({
      collection: {
        fields: [{ name: '_status', type: 'select', localized: true, access, hooks, options: [] }],
      } as SanitizedCollectionConfig,
      context: {},
      data: { _status: 'published' },
      doc: { _status: { en: 'published', es: 'draft', xx: 'draft' } },
      global: null,
      onFieldAccess: (result) => fieldAccessResults.push(result),
      operation: 'update',
      overrideAccess: false,
      req: {
        context: {},
        locale: 'all',
        payload: {
          config: {
            blocks: [],
            localization: {
              locales: [{ code: 'en' }, { code: 'es' }, { code: 'xx' }],
              localeCodes: ['en', 'es', 'xx'],
              filterAvailableLocales: ({ locales }) =>
                locales.filter((locale) => locale.code !== 'xx'),
            },
          },
        },
      } as PayloadRequest,
    })

    return { fieldAccessResults, result }
  }

  it('should preserve scalar publication intent across accessible locales', async () => {
    const { result } = await runPublication()

    expect(result._status).toBe('published')
  })

  it('should retain an earlier status access denial when a later locale is allowed', async () => {
    const { fieldAccessResults, result } = await runPublication({
      access: { update: ({ req }) => req.locale !== 'en' },
    })

    expect(fieldAccessResults.at(-1)).toEqual({ accessResult: false, path: '_status' })
    expect(result._status).toEqual({ en: 'published', es: 'published', xx: 'draft' })
  })

  it('should not restore intent removed by a hook even when fallback is published', async () => {
    const { result } = await runPublication({
      hooks: {
        beforeValidate: [
          ({ siblingData, req, value }) => {
            if (req.locale === 'en') {
              delete siblingData._status
            }

            return req.locale === 'en' ? undefined : value
          },
        ],
      },
    })

    expect(result._status).toEqual({ en: 'published', es: 'published', xx: 'draft' })
  })
})
