import type { CollectionPopulationRequestHandler } from './types.js'

import { describe, expect, it } from 'vitest'

import { mergeData } from './mergeData.js'

const createRequestHandler = ({
  onRequest,
}: {
  onRequest: (endpoint: string) => void
}): CollectionPopulationRequestHandler => {
  return async ({ endpoint }) => {
    onRequest(endpoint)

    return new Response(JSON.stringify({}))
  }
}

describe('mergeData', () => {
  it('should use the incoming ID when the initial data has no ID', async () => {
    let endpoint: string | undefined

    await mergeData({
      collectionSlug: 'posts',
      incomingData: { id: 'incoming-id' },
      initialData: {},
      requestHandler: createRequestHandler({
        onRequest: (requestedEndpoint) => {
          endpoint = requestedEndpoint
        },
      }),
      serverURL: 'https://example.com',
    })

    expect(endpoint).toBe('posts/incoming-id')
  })

  it('should prefer the initial ID when both data sets have an ID', async () => {
    let endpoint: string | undefined

    await mergeData({
      collectionSlug: 'posts',
      incomingData: { id: 'incoming-id' },
      initialData: { id: 'initial-id' },
      requestHandler: createRequestHandler({
        onRequest: (requestedEndpoint) => {
          endpoint = requestedEndpoint
        },
      }),
      serverURL: 'https://example.com',
    })

    expect(endpoint).toBe('posts/initial-id')
  })
})
