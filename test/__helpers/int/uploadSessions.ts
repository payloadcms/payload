import type { ClientUploadSession, UploadInstructions, UploadSegmentRequest } from 'payload'

import { uploadSessionsCollectionSlug } from 'payload/internal'
import { expect } from 'vitest'

import type { RESTClient } from '../shared/RESTClient.js'

const sessionsPath = `/${uploadSessionsCollectionSlug}` as const

/**
 * REST helpers shared by the storage adapter upload session suites. Sessions upload `fileBytes`
 * to `collectionSlug` unless a call names another collection.
 */
export const createUploadSessionHelpers = ({
  collectionSlug: defaultCollectionSlug,
  fileBytes,
  segmentUploadStatus = 200,
}: {
  collectionSlug: string
  fileBytes: Buffer
  /** The status storage answers a segment upload with. */
  segmentUploadStatus?: number
}) => {
  const createBody = ({
    collectionSlug = defaultCollectionSlug,
    filename = 'video.mp4',
    mimeType = 'video/mp4',
    operation = 'create',
    targetID,
  }: {
    collectionSlug?: string
    filename?: string
    mimeType?: string
    operation?: 'create' | 'update'
    targetID?: string
  }) => ({
    collectionSlug,
    file: { filename, lastModified: 1_700_000_000_000, mimeType, size: fileBytes.length },
    operation,
    targetID,
  })

  const createSession = async ({
    collectionSlug,
    operation,
    restClient,
    targetID,
  }: {
    collectionSlug?: string
    operation?: 'create' | 'update'
    restClient: RESTClient
    targetID?: string
  }): Promise<ClientUploadSession> => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({ collectionSlug, operation, targetID })),
    })

    expect(response.status).toBe(201)

    return (await response.json()) as ClientUploadSession
  }

  const getSession = async ({
    restClient,
    session,
  }: {
    restClient: RESTClient
    session: ClientUploadSession
  }): Promise<ClientUploadSession> => {
    const response = await restClient.GET(`${sessionsPath}/${session.id}`)

    return (await response.json()) as ClientUploadSession
  }

  const getInstructions = async ({
    restClient,
    session,
  }: {
    restClient: RESTClient
    session: ClientUploadSession
  }): Promise<{ requests: UploadSegmentRequest[]; session: ClientUploadSession }> => {
    const response = await restClient.POST(`${sessionsPath}/${session.id}/instructions`)

    expect(response.status).toBe(200)

    return response.json()
  }

  const putSegment = async ({
    bytes = fileBytes,
    request,
    session,
  }: {
    bytes?: Buffer
    request: UploadSegmentRequest
    session: ClientUploadSession
  }) => {
    const segment = session.transfer.segments.find(({ number }) => number === request.number)!
    const response = await fetch(request.url, {
      body: new Uint8Array(bytes.subarray(segment.start, segment.end)),
      headers: request.headers,
      method: request.method,
    })

    expect(response.status).toBe(segmentUploadStatus)
  }

  const uploadAllSegments = async ({
    bytes,
    restClient,
    session,
  }: {
    bytes?: Buffer
    restClient: RESTClient
    session: ClientUploadSession
  }) => {
    let { requests } = await getInstructions({ restClient, session })

    while (requests.length) {
      await Promise.all(requests.map((request) => putSegment({ bytes, request, session })))
      ;({ requests } = await getInstructions({ restClient, session }))
    }
  }

  const complete = async ({
    data,
    restClient,
    session,
  }: {
    data: Record<string, unknown>
    restClient: RESTClient
    session: ClientUploadSession
  }): Promise<{ doc: Record<string, any>; session: ClientUploadSession }> => {
    const response = await restClient.POST(`${sessionsPath}/${session.id}/complete`, {
      body: JSON.stringify({ data }),
    })

    expect(response.status).toBe(200)

    return response.json()
  }

  const completeStorage = async ({
    restClient,
    session,
  }: {
    restClient: RESTClient
    session: ClientUploadSession
  }): Promise<{ file: UploadInstructions['file']; session: ClientUploadSession }> => {
    const response = await restClient.POST(`${sessionsPath}/${session.id}/storage`)

    expect(response.status).toBe(200)

    return response.json()
  }

  const createWithFileReference = ({
    file,
    restClient,
    title,
  }: {
    file: UploadInstructions['file']
    restClient: RESTClient
    title: string
  }) => {
    const formData = new FormData()

    formData.append('_payload', JSON.stringify({ title }))
    formData.append('file', JSON.stringify(file))

    return restClient.POST(`/${defaultCollectionSlug}`, { body: formData })
  }

  return {
    complete,
    completeStorage,
    createBody,
    createSession,
    createWithFileReference,
    getInstructions,
    getSession,
    putSegment,
    uploadAllSegments,
  }
}

/**
 * Runs the browser uploader against the test server: requests to `/api` go to the in-process
 * Payload handler and segment uploads go straight to storage. Restores `fetch` after.
 */
export const withBrowserFetch = async <T>({
  onStoragePut,
  restClient,
  run,
}: {
  onStoragePut: (url: string) => void
  restClient: RESTClient
  run: () => Promise<T>
}): Promise<T> => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    if (url.startsWith('/api/')) {
      const path = url.slice('/api'.length) as `/${string}`
      const { body, method = 'GET', signal } = init

      signal?.throwIfAborted()

      return method === 'DELETE'
        ? restClient.DELETE(path)
        : method === 'GET'
          ? restClient.GET(path)
          : restClient.POST(path, { body: body ?? undefined })
    }

    const response = await originalFetch(input, init)

    if (init.method === 'PUT' && response.ok) {
      onStoragePut(url)
    }

    return response
  }

  try {
    return await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}
