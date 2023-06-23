import type { Config } from 'payload/config'
import { defaults } from 'payload/dist/config/defaults'

import { sentry } from './plugin'
import * as startSentryFuncs from './startSentry'

let startSentrySpy: jest.SpyInstance

describe('plugin', () => {
  beforeEach(() => {
    startSentrySpy = jest.spyOn(startSentryFuncs, 'startSentry').mockImplementation(() => {})
  })

  afterEach(() => {
    startSentrySpy.mockRestore()
  })

  it('should run the plugin', () => {
    const plugin = sentry({ enabled: true, dsn: 'asdf' })
    const config = plugin(createConfig())

    assertPluginRan(config)
  })

  it('should not run if dsn is not provided', () => {
    const plugin = sentry({ enabled: true, dsn: undefined })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })

  it('should respect enabled: false', () => {
    const plugin = sentry({ enabled: false })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })
})

function assertPluginRan(config: Config) {
  expect(config.admin?.webpack).toBeDefined()
  expect(config.hooks?.afterError).toBeDefined()
  expect(startSentrySpy).toHaveBeenCalled()
}

function assertPluginDidNotRun(config: Config) {
  expect(config.admin?.webpack).toBeDefined()
  expect(config.hooks?.afterError).toBeUndefined()
  expect(startSentrySpy).not.toHaveBeenCalled()
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  }
}
