import type { Config } from './types.js'

import { describe, expect, it } from 'vitest'

import { InvalidConfiguration } from '../errors/InvalidConfiguration.js'
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
  it('should default password hash iterations to 600000', async () => {
    const sanitizedConfig = await sanitizeConfig({ ...configDefaults })

    expect(sanitizedConfig.auth.passwordHashIterations).toBe(600000)
  })

  it('should keep configured password hash iterations', async () => {
    const sanitizedConfig = await sanitizeConfig({
      ...configDefaults,
      auth: { passwordHashIterations: 100000 },
    })

    expect(sanitizedConfig.auth.passwordHashIterations).toBe(100000)
  })

  it('should throw for unsupported password hash iterations', async () => {
    await expect(
      sanitizeConfig({
        ...configDefaults,
        // @ts-expect-error unsupported value from an untyped config
        auth: { passwordHashIterations: 200000 },
      }),
    ).rejects.toThrow(InvalidConfiguration)
  })
})
