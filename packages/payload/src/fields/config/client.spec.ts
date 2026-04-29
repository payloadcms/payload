import { describe, expect, it } from 'vitest'

import type { ImportMap } from '../../index.js'
import type { Field } from './types.js'

import { createClientField } from './client.js'

const stubI18n = {
  // Minimal stub. createClientField uses i18n only when translating labels;
  // these tests don't exercise that path.
  fallbackLanguage: 'en',
  language: 'en',
  t: (key: string) => key,
} as any

const stubImportMap = {} as ImportMap

describe('createClientField - admin.validate projection', () => {
  it('preserves a string-form admin.validate path', () => {
    const incoming: Field = {
      name: 'handle',
      type: 'text',
      admin: { validate: '@/v/handle' as any },
    } as Field

    const client = createClientField({
      defaultIDType: 'number',
      field: incoming,
      i18n: stubI18n,
      importMap: stubImportMap,
    }) as { admin?: { validate?: unknown } }

    expect(client.admin?.validate).toBe('@/v/handle')
  })

  it('preserves an object-form admin.validate ref', () => {
    const incoming: Field = {
      name: 'handle',
      type: 'text',
      admin: { validate: { exportName: 'format', path: '@/v/handle' } as any },
    } as Field

    const client = createClientField({
      defaultIDType: 'number',
      field: incoming,
      i18n: stubI18n,
      importMap: stubImportMap,
    }) as { admin?: { validate?: unknown } }

    expect(client.admin?.validate).toEqual({ exportName: 'format', path: '@/v/handle' })
  })

  it('still strips the inline top-level validate function', () => {
    const incoming: Field = {
      name: 'handle',
      type: 'text',
      validate: () => true,
    } as Field

    const client = createClientField({
      defaultIDType: 'number',
      field: incoming,
      i18n: stubI18n,
      importMap: stubImportMap,
    }) as { validate?: unknown }

    expect(client.validate).toBeUndefined()
  })

  it('still strips admin.condition and admin.components', () => {
    const incoming: Field = {
      name: 'handle',
      type: 'text',
      admin: {
        components: { Field: '@/MyField#default' },
        condition: () => true,
        validate: '@/v/handle' as any,
      } as any,
    } as Field

    const client = createClientField({
      defaultIDType: 'number',
      field: incoming,
      i18n: stubI18n,
      importMap: stubImportMap,
    }) as { admin?: { components?: unknown; condition?: unknown; validate?: unknown } }

    expect(client.admin?.condition).toBeUndefined()
    expect(client.admin?.components).toBeUndefined()
    expect(client.admin?.validate).toBe('@/v/handle')
  })
})
