import { describe, expect, it } from 'vitest'

import { sanitizeMCPConfig } from './sanitizeMCPConfig.js'

describe('MCP request body limit configuration', () => {
  it.each([0, -1, NaN, Infinity, -Infinity])(
    'should reject invalid maxRequestBodySize %s during config sanitization',
    (maxRequestBodySize) => {
      expect(() =>
        sanitizeMCPConfig({ config: {}, pluginConfig: { mcp: { maxRequestBodySize } } }),
      ).toThrow('mcp.maxRequestBodySize must be a positive, finite number of bytes.')
    },
  )

  it.each([undefined, 1, 4194304, 8388608])(
    'should accept maxRequestBodySize %s',
    (maxRequestBodySize) => {
      const config = sanitizeMCPConfig({
        config: {},
        pluginConfig: { mcp: { maxRequestBodySize } },
      })

      expect(config.mcp?.maxRequestBodySize).toBe(maxRequestBodySize)
    },
  )
})
