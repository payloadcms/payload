import { describe, expect, it } from 'vitest'

import { createClientImportRegistry } from '../utilities/clientImportRegistry.js'
import { runAdminValidate } from './runAdminValidate.js'

const ctx = {
  data: {},
  operation: 'update' as const,
  siblingData: undefined,
  user: null,
}

describe('runAdminValidate', () => {
  it('runs validators referenced via the client registry (default export)', async () => {
    const registry = createClientImportRegistry({
      '@/validators/min3#default': () =>
        Promise.resolve({
          default: (value: unknown) =>
            typeof value === 'string' && value.length >= 3 ? true : 'too short',
        }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: '@/validators/min3' }],
      values: { 'users.handle': 'ab' },
    })
    expect(errors.get('users.handle')).toBe('too short')
  })

  it('returns no error when validator passes', async () => {
    const registry = createClientImportRegistry({
      '@/validators/min3#default': () =>
        Promise.resolve({
          default: (value: unknown) =>
            typeof value === 'string' && value.length >= 3 ? true : 'too short',
        }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: '@/validators/min3' }],
      values: { 'users.handle': 'abcd' },
    })
    expect(errors.has('users.handle')).toBe(false)
  })

  it('honors named exports via { path, exportName }', async () => {
    const registry = createClientImportRegistry({
      '@/v/handle#format': () =>
        Promise.resolve({ format: (value: unknown) => (value === 'ok' ? true : 'nope') }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: { exportName: 'format', path: '@/v/handle' } }],
      values: { 'users.handle': 'bad' },
    })
    expect(errors.get('users.handle')).toBe('nope')
  })

  it('isolates errors thrown from one validator', async () => {
    const registry = createClientImportRegistry({
      '@/v/throws#default': () =>
        Promise.resolve({
          default: () => {
            throw new Error('boom')
          },
        }),
      '@/v/ok#default': () => Promise.resolve({ default: () => true }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [
        { path: 'users.a', ref: '@/v/throws' },
        { path: 'users.b', ref: '@/v/ok' },
      ],
      values: { 'users.a': 1, 'users.b': 2 },
    })
    expect(errors.get('users.a')).toBe('boom')
    expect(errors.has('users.b')).toBe(false)
  })

  it('treats async validators as no-ops on the edit path', async () => {
    const registry = createClientImportRegistry({
      '@/v/async#default': () =>
        Promise.resolve({ default: async (_v: unknown) => 'should not surface' }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: '@/v/async' }],
      values: { 'users.handle': 'x' },
    })
    expect(errors.has('users.handle')).toBe(false)
  })

  it('reports a clear error when ref is unregistered', async () => {
    const registry = createClientImportRegistry({})
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: '@/v/missing' }],
      values: { 'users.handle': 'x' },
    })
    expect(errors.get('users.handle')).toMatch(/not found|unregistered|missing/i)
  })

  it('reports a clear error when ref resolves to a non-function', async () => {
    const registry = createClientImportRegistry({
      '@/v/notafn#default': () => Promise.resolve({ default: 'this is a string' }),
    })
    const errors = await runAdminValidate({
      context: ctx,
      registry,
      validators: [{ path: 'users.handle', ref: '@/v/notafn' }],
      values: { 'users.handle': 'x' },
    })
    expect(errors.get('users.handle')).toMatch(/not.*function/i)
  })
})
