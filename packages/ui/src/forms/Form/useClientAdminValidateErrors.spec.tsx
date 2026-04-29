import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClientAdminValidateErrors } from './useClientAdminValidateErrors.js'

const HANDLE_MIN3 = './validators/handleMin3.js#handleMin3'

const ctx = {
  data: {},
  operation: 'update' as const,
  siblingData: undefined,
  user: null,
}

describe('useClientAdminValidateErrors', () => {
  // Hook emits dev-mode console.warn for genuinely misconfigured refs (non-function
  // exports, throws during invocation, parse failures). Silence them here so the
  // test output stays clean — the warn signal is for live admin debugging.
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns an empty map when there are no refs', () => {
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {},
        refs: [],
        registry: null,
        values: {},
      }),
    )
    expect(result.current.size).toBe(0)
  })

  it('surfaces an error message when the validator returns a string', async () => {
    const factories = {
      [HANDLE_MIN3]: () =>
        Promise.resolve({
          handleMin3: (value: unknown) =>
            typeof value === 'string' && value.length >= 3 ? true : 'too short',
        }),
    }
    const { result, rerender } = renderHook(
      ({ values }: { values: Record<string, unknown> }) =>
        useClientAdminValidateErrors({
          context: ctx,
          // Phase 10: hook only runs validators on touched fields.
          formState: { 'posts.handle': { isModified: true } } as any,
          refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
          registry: makeRegistry(factories),
          values,
        }),
      { initialProps: { values: { 'posts.handle': 'ab' } } },
    )

    await waitFor(() => {
      expect(result.current.has('posts.handle')).toBe(true)
    })
    expect(result.current.get('posts.handle')).toBe('too short')

    rerender({ values: { 'posts.handle': 'abcd' } })
    expect(result.current.has('posts.handle')).toBe(false)
    await flushMicrotasks()
  })

  it('treats async validators as no-ops on the edit path', async () => {
    const factories = {
      [HANDLE_MIN3]: () =>
        Promise.resolve({ handleMin3: async (_v: unknown) => 'should not surface' }),
    }
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {},
        refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
        registry: makeRegistry(factories),
        values: { 'posts.handle': 'ab' },
      }),
    )
    await flushMicrotasks()
    expect(result.current.has('posts.handle')).toBe(false)
  })

  it('isolates errors thrown from one validator', async () => {
    const factories = {
      '@/v/throws.js#throws': () =>
        Promise.resolve({
          throws: () => {
            throw new Error('boom')
          },
        }),
      '@/v/ok.js#ok': () => Promise.resolve({ ok: () => true }),
    }
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {
          'posts.a': { isModified: true },
          'posts.b': { isModified: true },
        } as any,
        refs: [
          { fieldPath: 'posts.a', ref: '@/v/throws.js#throws' },
          { fieldPath: 'posts.b', ref: '@/v/ok.js#ok' },
        ],
        registry: makeRegistry(factories),
        values: { 'posts.a': 1, 'posts.b': 2 },
      }),
    )
    await waitFor(() => {
      expect(result.current.has('posts.a')).toBe(true)
    })
    expect(result.current.get('posts.a')).toBe('boom')
    expect(result.current.has('posts.b')).toBe(false)
  })

  it('skips a ref that resolves to a non-function and emits no entry', async () => {
    const factories = {
      [HANDLE_MIN3]: () => Promise.resolve({ handleMin3: 'not a function' }),
    }
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {},
        refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
        registry: makeRegistry(factories),
        values: { 'posts.handle': 'ab' },
      }),
    )
    await flushMicrotasks()
    expect(result.current.has('posts.handle')).toBe(false)
  })

  it('skips a ref that is not present in the registry', async () => {
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {},
        refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
        registry: makeRegistry({}),
        values: { 'posts.handle': 'ab' },
      }),
    )
    await flushMicrotasks()
    expect(result.current.has('posts.handle')).toBe(false)
  })

  it('does not run validators on untouched fields (no isModified flag)', async () => {
    const factories = {
      [HANDLE_MIN3]: () =>
        Promise.resolve({
          handleMin3: (value: unknown) =>
            typeof value === 'string' && value.length >= 3 ? true : 'too short',
        }),
    }
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        // Field absent from formState (or isModified !== true) → validator skipped.
        formState: {},
        refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
        registry: makeRegistry(factories),
        values: { 'posts.handle': 'ab' },
      }),
    )
    await flushMicrotasks()
    expect(result.current.has('posts.handle')).toBe(false)
  })

  it('returns an empty map when no registry is provided (graceful fallback)', () => {
    const { result } = renderHook(() =>
      useClientAdminValidateErrors({
        context: ctx,
        formState: {},
        refs: [{ fieldPath: 'posts.handle', ref: HANDLE_MIN3 }],
        registry: null,
        values: { 'posts.handle': 'ab' },
      }),
    )
    expect(result.current.size).toBe(0)
  })
})

// Lightweight registry that mirrors createClientImportRegistry but lets the test
// pass the same factory map both to the provider (for hook-mount integration) and
// to the registry instance directly (for the hook's own input).
function makeRegistry(factories: Record<string, () => Promise<unknown>>) {
  return {
    has(path: string) {
      return Object.hasOwn(factories, path)
    },
    resolve(path: string): Promise<unknown> {
      if (!Object.hasOwn(factories, path)) {
        return Promise.resolve(null)
      }
      return factories[path]!().then((value) => value ?? null)
    },
  }
}

// Drain microtasks (and one macrotask) to let any in-flight resolution promises
// settle before the test teardown closes the worker.
async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}
