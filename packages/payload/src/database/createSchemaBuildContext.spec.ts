import { describe, expect, test, vi } from 'vitest'

import { createSchemaBuildContext } from './createSchemaBuildContext.js'

describe('createSchemaBuildContext', () => {
  test('should not expose cache metrics from the production context', () => {
    const context = createSchemaBuildContext<object>()

    expect(context).not.toHaveProperty('snapshot')
  })

  test('should build once for the same definition identity and variant', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}
    const artifact = {}
    const build = vi.fn(() => artifact)

    const first = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:hero',
    })
    const second = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:hero',
    })

    expect(first).toBe(artifact)
    expect(second).toBe(artifact)
    expect(build).toHaveBeenCalledOnce()
  })

  test('should build separate artifacts for separate variants', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}

    const live = context.getOrCreate({
      build: () => ({ variant: 'live' }),
      definition,
      cacheKey: 'block:hero',
    })
    const version = context.getOrCreate({
      build: () => ({ variant: 'version' }),
      definition,
      cacheKey: 'block:hero-version',
    })

    expect(live).not.toBe(version)
  })

  test('should build a fresh artifact when caching is disabled', () => {
    const context = createSchemaBuildContext<object>({ isCacheEnabled: false })
    const definition = {}
    const build = vi.fn(() => ({}))

    const first = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:hero',
    })
    const second = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:hero',
    })

    expect(first).not.toBe(second)
    expect(build).toHaveBeenCalledTimes(2)
  })

  test('should not merge equal definitions with different object identities', () => {
    const context = createSchemaBuildContext<object>()
    const first = context.getOrCreate({
      build: () => ({ source: 'first' }),
      definition: { slug: 'hero' },
      cacheKey: 'block:hero',
    })
    const second = context.getOrCreate({
      build: () => ({ source: 'second' }),
      definition: { slug: 'hero' },
      cacheKey: 'block:hero',
    })

    expect(first).not.toBe(second)
  })

  test('should not share artifacts between contexts', () => {
    const definition = {}
    const firstContext = createSchemaBuildContext<object>()
    const secondContext = createSchemaBuildContext<object>()
    const first = firstContext.getOrCreate({
      build: () => ({ context: 'first' }),
      definition,
      cacheKey: 'block:hero',
    })
    const second = secondContext.getOrCreate({
      build: () => ({ context: 'second' }),
      definition,
      cacheKey: 'block:hero',
    })

    expect(first).not.toBe(second)
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

    expect(() => context.getOrCreate({ build, cacheKey: 'block:hero', definition })).toThrow(
      'build failed',
    )
    expect(context.getOrCreate({ build, cacheKey: 'block:hero', definition })).toBe(artifact)
    expect(build).toHaveBeenCalledTimes(2)
  })

  test('should reset artifacts when cleared', () => {
    const context = createSchemaBuildContext<object>()
    const definition = {}
    const first = context.getOrCreate({
      build: () => ({ build: 1 }),
      definition,
      cacheKey: 'block:hero',
    })

    context.clear()

    const second = context.getOrCreate({
      build: () => ({ build: 2 }),
      definition,
      cacheKey: 'block:hero',
    })

    expect(second).not.toBe(first)
  })
})
