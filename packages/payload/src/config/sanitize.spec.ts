import type { Block } from '../fields/config/types.js'
import type { Config } from './types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from './sanitize.js'

const configDefaults: Config = {
  db: {
    defaultIDType: 'text',
    // @ts-expect-error partial config
    init: () => {},
  },
  secret: 'secret',
}

describe('sanitizeConfig', () => {
  it('should keep already sanitized blocks when the config is sanitized again', async () => {
    const block: Block = {
      slug: 'text',
      fields: [{ name: 'content', type: 'textarea' }],
    }

    await sanitizeConfig({ ...configDefaults, blocks: [block] })

    const sanitizedConfig = await sanitizeConfig({ ...configDefaults, blocks: [block] })

    expect(sanitizedConfig.blocks).toHaveLength(1)
    expect(sanitizedConfig.blocks?.[0]?.slug).toBe('text')
  })
})
