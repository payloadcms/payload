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
      cacheKey: 'block:shared',
    })
    const second = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:shared',
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
      cacheKey: 'block:shared',
    })
    const second = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:shared',
    })

    expect(first).not.toBe(second)
    expect(build).toHaveBeenCalledTimes(2)
  })

  test('should build independent schemas when the Mongoose instance has a custom plugin', () => {
    const mongooseWithCustomPlugin = new mongoose.Mongoose({ createInitialConnection: false })
    mongooseWithCustomPlugin.plugin(() => undefined)
    const connection = mongooseWithCustomPlugin.createConnection()
    const context = createMongoSchemaBuildContext({ connection })
    const definition = {}
    const build = vi.fn(() => new mongoose.Schema())

    const first = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:shared',
    })
    const second = context.getOrCreate({
      build,
      definition,
      cacheKey: 'block:shared',
    })

    expect(first).not.toBe(second)
    expect(build).toHaveBeenCalledTimes(2)
  })
})
