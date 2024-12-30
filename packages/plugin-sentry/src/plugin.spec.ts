import type { AfterErrorHook, AfterErrorHookArgs, Config, PayloadRequest } from 'payload'

import { APIError, defaults } from 'payload'

import { sentryPlugin } from './index'
import { randomUUID } from 'crypto'

const mockExceptionID = randomUUID()

const mockSentry = {
  captureException() {
    return mockExceptionID
  },
}

describe('@payloadcms/plugin-sentry - unit', () => {
  it('should run the plugin', () => {
    const plugin = sentryPlugin({ Sentry: mockSentry, enabled: true })
    const config = plugin(createConfig())

    assertPluginRan(config)
  })

  it('should default enabled: true', () => {
    const plugin = sentryPlugin({ Sentry: mockSentry })
    const config = plugin(createConfig())

    assertPluginRan(config)
  })

  it('should not run if Sentry is not provided', () => {
    const plugin = sentryPlugin({ enabled: true })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })

  it('should respect enabled: false', () => {
    const plugin = sentryPlugin({ Sentry: mockSentry, enabled: false })
    const config = plugin(createConfig())

    assertPluginDidNotRun(config)
  })

  it('should execute Sentry.captureException with correct errors / args', async () => {
    const hintTimestamp = Date.now()

    const plugin = sentryPlugin({
      Sentry: mockSentry,
      options: {
        context: ({ defaultContext }) => ({
          ...defaultContext,
          extra: {
            ...defaultContext.extra,
            hintTimestamp,
          },
        }),
      },
    })
    const config = plugin(createConfig())

    const hook = config.hooks?.afterError?.[0] as AfterErrorHook

    const apiError = new Error('ApiError')

    const afterApiErrorHookArgs: AfterErrorHookArgs = {
      req: {} as PayloadRequest,
      context: {},
      error: apiError,
      collection: { slug: 'mock-slug' } as any,
    }

    const captureExceptionSpy = jest.spyOn(mockSentry, 'captureException')

    await hook(afterApiErrorHookArgs)

    expect(captureExceptionSpy).toHaveBeenCalledTimes(1)
    expect(captureExceptionSpy).toHaveBeenCalledWith(apiError, {
      extra: {
        errorCollectionSlug: 'mock-slug',
        hintTimestamp,
      },
    })
    expect(captureExceptionSpy).toHaveReturnedWith(mockExceptionID)

    const error = new Error('Error')

    const afterErrorHookArgs: AfterErrorHookArgs = {
      req: {} as PayloadRequest,
      context: {},
      error,
      collection: { slug: 'mock-slug' } as any,
    }

    await hook(afterErrorHookArgs)

    expect(captureExceptionSpy).toHaveBeenCalledTimes(2)
    expect(captureExceptionSpy).toHaveBeenCalledWith(error, {
      extra: {
        errorCollectionSlug: 'mock-slug',
        hintTimestamp,
      },
    })
    expect(captureExceptionSpy).toHaveReturnedWith(mockExceptionID)
  })
})

function assertPluginRan(config: Config) {
  expect(config.hooks?.afterError?.[0]).toBeDefined()
}

function assertPluginDidNotRun(config: Config) {
  expect(config.hooks?.afterError?.[0]).toBeUndefined()
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}
