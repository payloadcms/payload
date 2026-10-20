import { describe, expect, it } from 'vitest'

import { payloadApiHandlers } from './rest.js'

describe('@payloadcms/tanstack-start/rest', () => {
  it('should expose API handlers without loading the Payload config', () => {
    let hasLoadedConfig = false

    const handlers = payloadApiHandlers({
      getConfig: () => {
        hasLoadedConfig = true
        throw new Error('Config should load on the first API request')
      },
    })

    expect(handlers.GET).toBeTypeOf('function')
    expect(hasLoadedConfig).toBe(false)
  })
})
