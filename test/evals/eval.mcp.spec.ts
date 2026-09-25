import { describe } from 'vitest'

import { mcpDataset } from './datasets/mcp.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe.skipIf(!options.capabilities?.includes('mcp'))(`MCP${labelSuffix}`, () => {
  registerCodegenCases(mcpDataset, 'MCP', {
    ...options,
    exposeMcpTools: true,
  })
})
