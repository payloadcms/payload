import { describe, expect, test, vi } from 'vitest'

import type { SchemaBuildCacheEvent } from './createSchemaBuildContext.js'

import { createSchemaBuildContext } from './createSchemaBuildContext.js'

describe('createSchemaBuildContext', () => {
  test('should build once for the same definition identity and variant', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}
    const artifact = {}
    const build = vi.fn(() => artifact)

    const first = context.getOrCreate({
      build,
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })
    const second = context.getOrCreate({
      build,
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })

    expect(first).toBe(artifact)
    expect(second).toBe(artifact)
    expect(build).toHaveBeenCalledOnce()
    expect(context.snapshot()).toEqual({
      entries: [{ hits: 1, label: 'block:hero', misses: 1, variantKey: 'live' }],
      hits: 1,
      misses: 1,
    })
  })

  test('should build separate artifacts for separate variants', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}

    const live = context.getOrCreate({
      build: () => ({ variant: 'live' }),
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })
    const version = context.getOrCreate({
      build: () => ({ variant: 'version' }),
      definition,
      label: 'block:hero',
      variantKey: 'version',
    })

    expect(live).not.toBe(version)
    expect(context.snapshot().misses).toBe(2)
  })

  test('should build a fresh artifact when caching is disabled', () => {
    const context = createSchemaBuildContext<object>({ isCacheEnabled: false })
    const definition = {}
    const build = vi.fn(() => ({}))

    const first = context.getOrCreate({
      build,
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })
    const second = context.getOrCreate({
      build,
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })

    expect(first).not.toBe(second)
    expect(build).toHaveBeenCalledTimes(2)
    expect(context.snapshot()).toEqual({
      entries: [{ hits: 0, label: 'block:hero', misses: 2, variantKey: 'live' }],
      hits: 0,
      misses: 2,
    })
  })

  test('should not merge equal definitions with different object identities', () => {
    const context = createSchemaBuildContext<object>()
    const first = context.getOrCreate({
      build: () => ({ source: 'first' }),
      definition: { slug: 'hero' },
      label: 'block:hero',
      variantKey: 'live',
    })
    const second = context.getOrCreate({
      build: () => ({ source: 'second' }),
      definition: { slug: 'hero' },
      label: 'block:hero',
      variantKey: 'live',
    })

    expect(first).not.toBe(second)
    expect(context.snapshot()).toEqual({
      entries: [{ hits: 0, label: 'block:hero', misses: 2, variantKey: 'live' }],
      hits: 0,
      misses: 2,
    })
  })

  test('should not share artifacts between contexts', () => {
    const definition = {}
    const firstContext = createSchemaBuildContext<object>()
    const secondContext = createSchemaBuildContext<object>()
    const first = firstContext.getOrCreate({
      build: () => ({ context: 'first' }),
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })
    const second = secondContext.getOrCreate({
      build: () => ({ context: 'second' }),
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })

    expect(first).not.toBe(second)
    expect(firstContext.snapshot().misses).toBe(1)
    expect(secondContext.snapshot().misses).toBe(1)
  })

  test('should retry after a builder throws', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}
    const artifact = {}
    const build = vi.fn<() => object>()
    build.mockImplementationOnce(() => {
      throw new Error('build failed')
    })
    build.mockReturnValueOnce(artifact)

    expect(() =>
      context.getOrCreate({ build, definition, label: 'block:hero', variantKey: 'live' }),
    ).toThrow('build failed')
    expect(
      context.getOrCreate({ build, definition, label: 'block:hero', variantKey: 'live' }),
    ).toBe(artifact)
    expect(build).toHaveBeenCalledTimes(2)
  })

  test('should report ordered hit, miss, and store events', () => {
    const events: SchemaBuildCacheEvent<object>[] = []
    const context = createSchemaBuildContext<object>({
      onEvent: (event) => events.push(event),
    })
    const definition = {}
    const artifact = {}

    context.getOrCreate({
      build: () => artifact,
      definition,
      label: 'block:a|b',
      variantKey: 'variant|one',
    })
    context.getOrCreate({
      build: () => ({ unused: true }),
      definition,
      label: 'block:a|b',
      variantKey: 'variant|one',
    })

    expect(events).toEqual([
      { action: 'miss', label: 'block:a|b', variantKey: 'variant|one' },
      { action: 'store', label: 'block:a|b', schema: artifact, variantKey: 'variant|one' },
      { action: 'hit', label: 'block:a|b', variantKey: 'variant|one' },
    ])
  })

  test('should reset artifacts and counters when cleared', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}
    const first = context.getOrCreate({
      build: () => ({ build: 1 }),
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })

    context.clear()

    expect(context.snapshot()).toEqual({ entries: [], hits: 0, misses: 0 })

    const second = context.getOrCreate({
      build: () => ({ build: 2 }),
      definition,
      label: 'block:hero',
      variantKey: 'live',
    })

    expect(second).not.toBe(first)
    expect(context.snapshot()).toEqual({
      entries: [{ hits: 0, label: 'block:hero', misses: 1, variantKey: 'live' }],
      hits: 0,
      misses: 1,
    })
  })
})
