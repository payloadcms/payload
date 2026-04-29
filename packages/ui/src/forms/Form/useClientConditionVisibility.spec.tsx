import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClientConditionVisibility } from './useClientConditionVisibility.js'

const SHOW_ADVANCED = './conditions/showAdvanced.js#showAdvanced'

describe('useClientConditionVisibility', () => {
  // Hook emits dev-mode console.warn for genuinely misconfigured refs (non-function
  // exports, throws during resolution, parse failures). Silence them here so the
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
      useClientConditionVisibility({
        data: {},
        formState: {},
        operation: 'update',
        refs: [],
        registry: null,
        user: null,
      }),
    )
    expect(result.current.size).toBe(0)
  })

  it('resolves a ref via the registry and exposes visibility for the field path', async () => {
    const factories = {
      [SHOW_ADVANCED]: () =>
        Promise.resolve({
          showAdvanced: (data: { showAdvanced?: boolean }) => Boolean(data?.showAdvanced),
        }),
    }
    const { result, rerender } = renderHook(
      ({ data }: { data: Record<string, unknown> }) =>
        useClientConditionVisibility({
          data,
          formState: {},
          operation: 'update',
          refs: [{ fieldPath: 'posts.advancedNote', ref: SHOW_ADVANCED }],
          registry: makeRegistry(factories),
          user: null,
        }),
      { initialProps: { data: { showAdvanced: false } } },
    )

    await waitFor(() => {
      expect(result.current.has('posts.advancedNote')).toBe(true)
    })
    expect(result.current.get('posts.advancedNote')).toBe(false)

    rerender({ data: { showAdvanced: true } })
    expect(result.current.get('posts.advancedNote')).toBe(true)
    await flushMicrotasks()
  })

  it('skips a ref that resolves to a non-function and emits no entry', async () => {
    const factories = {
      [SHOW_ADVANCED]: () => Promise.resolve({ showAdvanced: 'not a function' }),
    }
    const { result } = renderHook(() =>
      useClientConditionVisibility({
        data: {},
        formState: {},
        operation: 'update',
        refs: [{ fieldPath: 'posts.advancedNote', ref: SHOW_ADVANCED }],
        registry: makeRegistry(factories),
        user: null,
      }),
    )
    // Drain the resolution promise. The non-function branch silently skips the
    // ref so nothing should appear in the visibility map.
    await flushMicrotasks()
    expect(result.current.has('posts.advancedNote')).toBe(false)
  })

  it('skips a ref that is not present in the registry', async () => {
    const { result } = renderHook(() =>
      useClientConditionVisibility({
        data: {},
        formState: {},
        operation: 'update',
        refs: [{ fieldPath: 'posts.advancedNote', ref: SHOW_ADVANCED }],
        registry: makeRegistry({}),
        user: null,
      }),
    )
    await flushMicrotasks()
    expect(result.current.has('posts.advancedNote')).toBe(false)
  })

  it('returns an empty map when no registry is provided (graceful fallback)', () => {
    const { result } = renderHook(() =>
      useClientConditionVisibility({
        data: { showAdvanced: true },
        formState: {},
        operation: 'update',
        refs: [{ fieldPath: 'posts.advancedNote', ref: SHOW_ADVANCED }],
        registry: null,
        user: null,
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
// settle before the test teardown closes the worker. Without this, a late
// `console.warn` after teardown can trip vitest's RPC pipe (
// "Closing rpc while 'onUserConsoleLog' was pending").
async function flushMicrotasks(): Promise<void> {
  // Two macroticks is enough to flush the Promise.all -> per-ref .then -> outer .then
  // chain that the hook schedules.
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}
