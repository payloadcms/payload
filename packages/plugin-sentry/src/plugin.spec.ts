import type { Config } from 'payload/config'
import { defaults } from 'payload/config'

import { sentry } from './plugin'

describe('plugin', () => {
  it('should run the plugin', () => {
    const plugin = sentry({ enabled: true, dsn: 'asdf' })
    const config = plugin(createConfig())

    assertPluginRan(config)
  })

  it('should default enable: true', () => {
    const plugin = sentry({ dsn: 'asdf' })
    const config = plugin(createConfig())

    assertPluginRan(config)
  })

  it('should not run if dsn is not provided', () => {
    const plugin = sentry({ enabled: true, dsn: null })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })

  it('should respect enabled: false', () => {
    const plugin = sentry({ enabled: false, dsn: null })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })
})

function assertPluginRan(config: Config) {
  expect(config.admin?.webpack).toBeDefined()
  expect(config.hooks?.afterError).toBeDefined()
  expect(config.onInit).toBeDefined()
}

function assertPluginDidNotRun(config: Config) {
  expect(config.admin?.webpack).toBeDefined()
  expect(config.hooks?.afterError).toBeUndefined()
  expect(config.onInit).toBeUndefined()
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
