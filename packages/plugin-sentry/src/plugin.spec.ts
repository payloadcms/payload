import type { AfterErrorHook, AfterErrorHookArgs, Config, PayloadRequest } from 'payload'
import { randomUUID } from 'crypto'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

import { APIError, defaults } from 'payload'

import { sentryPlugin } from './index'

const mockExceptionID = randomUUID()

const mockSentry = {
  captureException() {
    return mockExceptionID
  },
}

describe('@payloadcms/plugin-sentry - unit', () => {
  beforeEach(() => {
    vitest.restoreAllMocks()
  })

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

  it('should append the admin provider and preserve existing providers', () => {
    const plugin = sentryPlugin({ Sentry: mockSentry })
    const config = plugin(
      createConfig({
        admin: {
          components: {
            providers: ['existing#Provider'],
          },
        } as Config['admin'],
      }),
    )

    expect(config.admin?.components?.providers).toEqual([
      'existing#Provider',
      '@payloadcms/plugin-sentry/client#AdminErrorBoundary',
    ])
  })

  it('should capture 500 errors with merged context and user details', async () => {
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
          tags: {
            locale: 'en',
          },
        }),
      },
    })
    const config = plugin(createConfig())

    const hook = getSentryAfterErrorHook(config)
    const captureExceptionSpy = vitest.spyOn(mockSentry, 'captureException')
    const error = new Error('Internal Server Error')

    await hook(
      createAfterErrorHookArgs({
        error,
        req: {
          headers: new Headers({
            'X-Forwarded-For': '203.0.113.10',
          }),
          user: {
            collection: 'users',
            email: 'dev@payloadcms.com',
            id: '123',
            username: 'payload-dev',
          },
        } as PayloadRequest,
      }),
    )

    expect(captureExceptionSpy).toHaveBeenCalledTimes(1)
    expect(captureExceptionSpy).toHaveBeenCalledWith(error, {
      extra: {
        errorCollectionSlug: 'mock-slug',
        hintTimestamp,
      },
      tags: {
        locale: 'en',
      },
      user: {
        collection: 'users',
        email: 'dev@payloadcms.com',
        id: '123',
        ip_address: '203.0.113.10',
        username: 'payload-dev',
      },
    })
    expect(captureExceptionSpy).toHaveReturnedWith(mockExceptionID)
  })

  it('should capture configured non-500 errors', async () => {
    const plugin = sentryPlugin({
      Sentry: mockSentry,
      options: {
        captureErrors: [403],
      },
    })
    const config = plugin(createConfig())

    const hook = getSentryAfterErrorHook(config)
    const captureExceptionSpy = vitest.spyOn(mockSentry, 'captureException')
    const error = new APIError('Forbidden', 403)

    await hook(
      createAfterErrorHookArgs({
        error,
      }),
    )

    expect(captureExceptionSpy).toHaveBeenCalledTimes(1)
    expect(captureExceptionSpy).toHaveBeenCalledWith(error, {
      extra: {
        errorCollectionSlug: 'mock-slug',
      },
    })
    expect(captureExceptionSpy).toHaveReturnedWith(mockExceptionID)
  })

  it('should ignore non-configured 4xx errors', async () => {
    const plugin = sentryPlugin({ Sentry: mockSentry })
    const config = plugin(createConfig())

    const hook = getSentryAfterErrorHook(config)
    const captureExceptionSpy = vitest.spyOn(mockSentry, 'captureException')

    await hook(
      createAfterErrorHookArgs({
        error: new APIError('Not Found', 404),
      }),
    )

    expect(captureExceptionSpy).not.toHaveBeenCalled()
  })
})

function assertPluginRan(config: Config) {
  expect(config.hooks?.afterError?.[0]).toBeDefined()
}

function assertPluginDidNotRun(config: Config) {
  expect(config.hooks?.afterError?.[0]).toBeUndefined()
}

function createAfterErrorHookArgs(overrides?: Partial<AfterErrorHookArgs>): AfterErrorHookArgs {
  return {
    collection: { slug: 'mock-slug' } as any,
    context: {},
    error: new Error('Error'),
    req: {
      headers: new Headers(),
    } as PayloadRequest,
    ...overrides,
  }
}

function createConfig(overrides?: Partial<Config>): Config {
  return {
    ...defaults,
    ...overrides,
  } as Config
}

function getSentryAfterErrorHook(config: Config): AfterErrorHook {
  const hooks = config.hooks?.afterError

  expect(hooks).toBeDefined()
  expect(hooks?.length).toBeGreaterThan(0)

  return hooks?.[hooks.length - 1] as AfterErrorHook
}
