import mongoose from 'mongoose'
import { describe, expect, test, vi } from 'vitest'

import { createMongoSchemaBuildContext } from './schemaBuildContext.js'

describe('createMongoSchemaBuildContext', () => {
  test('should reuse schemas when the connection has no custom plugins', () => {
    const connection = mongoose.createConnection()
    const context = createMongoSchemaBuildContext({ connection })
    const definition = {}
    const build = vi.fn(() => new mongoose.Schema())

    const first = context.getOrCreate({
      build,
      definition,
      label: 'block:shared',
      variantKey: 'live',
    })
    const second = context.getOrCreate({
      build,
      definition,
      label: 'block:shared',
      variantKey: 'live',
    })

    expect(first).toBe(second)
    expect(build).toHaveBeenCalledOnce()
  })

  test('should build independent schemas when the connection has a custom plugin', () => {
    const connection = mongoose.createConnection()
    connection.plugin(() => undefined)
    const context = createMongoSchemaBuildContext({ connection })
    const definition = {}
    const build = vi.fn(() => new mongoose.Schema())

    const first = context.getOrCreate({
      build,
      definition,
      label: 'block:shared',
      variantKey: 'live',
    })
    const second = context.getOrCreate({
      build,
      definition,
      label: 'block:shared',
      variantKey: 'live',
    })

    expect(first).not.toBe(second)
    expect(build).toHaveBeenCalledTimes(2)
  })
})
