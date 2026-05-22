import type { SanitizedConfig } from 'payload'

import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import { createPayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GRAPHQL_PLAYGROUND_GET } from './index.js'
import { GET } from './playground.js'

vi.mock('@graphql-yoga/render-graphiql', () => ({
  renderGraphiQL: vi.fn(),
}))

vi.mock('payload', () => ({
  createPayloadRequest: vi.fn(),
}))

vi.mock('./handler.js', () => ({
  POST: vi.fn(),
}))

const createConfig = ({
  graphQL,
  routes,
}: {
  graphQL?: Partial<SanitizedConfig['graphQL']>
  routes?: Partial<SanitizedConfig['routes']>
} = {}): SanitizedConfig =>
  ({
    graphQL: {
      disable: false,
      disablePlaygroundInProduction: true,
      ...graphQL,
    },
    routes: {
      api: '/api',
      graphQL: '/graphql',
      graphQLPlayground: '/graphql-playground',
      ...routes,
    },
  }) as SanitizedConfig

const requestGraphiQL = async ({
  config = createConfig(),
}: {
  config?: SanitizedConfig
} = {}) => {
  const handler = GET(Promise.resolve(config))

  return handler(new Request('http://localhost/api/graphql-playground'))
}

describe('GraphQL Playground route', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')

    vi.mocked(createPayloadRequest).mockImplementation(async ({ config }) => {
      const resolvedConfig = await config

      return {
        payload: {
          config: resolvedConfig,
        },
      } as Awaited<ReturnType<typeof createPayloadRequest>>
    })

    vi.mocked(renderGraphiQL).mockImplementation((options) => {
      return `<html><body>GraphiQL ${JSON.stringify(options)}</body></html>`
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('should expose the GraphiQL handler through the GraphQL Playground export', () => {
    expect(GRAPHQL_PLAYGROUND_GET).toBe(GET)
  })

  it('should render GraphiQL with the configured GraphQL endpoint and included credentials', async () => {
    const config = createConfig({
      routes: {
        api: '/custom-api',
        graphQL: '/custom-graphql',
      },
    })

    const response = await requestGraphiQL({ config })
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')
    expect(html).toContain('GraphiQL')
    expect(renderGraphiQL).toHaveBeenCalledWith({
      credentials: 'include',
      endpoint: '/custom-api/custom-graphql',
      title: 'Payload GraphiQL',
    })
  })

  it('should return 404 when GraphQL is disabled', async () => {
    const config = createConfig({
      graphQL: {
        disable: true,
        disablePlaygroundInProduction: false,
      },
    })

    const response = await requestGraphiQL({ config })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Route Not Found')
    expect(renderGraphiQL).not.toHaveBeenCalled()
  })

  it('should return 404 in production when the playground is disabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const response = await requestGraphiQL()

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Route Not Found')
    expect(renderGraphiQL).not.toHaveBeenCalled()
  })

  it('should render GraphiQL in production when the playground is explicitly enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const config = createConfig({
      graphQL: {
        disablePlaygroundInProduction: false,
      },
    })

    const response = await requestGraphiQL({ config })

    expect(response.status).toBe(200)
    expect(renderGraphiQL).toHaveBeenCalledWith({
      credentials: 'include',
      endpoint: '/api/graphql',
      title: 'Payload GraphiQL',
    })
  })
})
