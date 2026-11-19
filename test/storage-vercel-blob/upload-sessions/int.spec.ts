/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options", "test.for", "test.each"] }] -- Tests use the shared fixture wrapper. */
import type { ClientUploadSession, UploadInstructions, UploadSegmentRequest } from 'payload'

import { del, head, list, put } from '@vercel/blob'
import { randomBytes } from 'node:crypto'
import { uploadSessionsCollectionSlug } from 'payload/internal'
import { expect } from 'vitest'

import type { RESTClient } from '../../__helpers/shared/RESTClient.js'

import { UPLOAD_STAGING_PREFIX } from '../../../packages/storage-vercel-blob/src/segmentedUpload.js'
/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the real browser uploader, which is not exported. */
import {
  resumeUploadSession,
  uploadWithSession,
} from '../../../packages/ui/src/utilities/uploadWithSession.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../../__helpers/int/vitest.js'
import { uploadSessionsPrefix, videosSlug } from '../shared.js'

const sessionsPath = `/${uploadSessionsCollectionSlug}` as const

// Three 5 MiB segments: 5 + 5 + 1.
const fileBytes = randomBytes(11 * 1024 * 1024)

const stagingPrefix = `${UPLOAD_STAGING_PREFIX}${uploadSessionsPrefix}/`

test.suite('@payloadcms/storage-vercel-blob upload sessions', { config: './config.ts' }, () => {
  test.beforeEach(async () => {
    await clearBlobs()
  })

  test.afterEach(async () => {
    await clearBlobs()
  })

  test('should upload a file in segments and create the document on completion', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    expect(session.transfer.segments).toHaveLength(3)

    await uploadAllSegments({ restClient, session })

    const { doc, session: completedSession } = await complete({
      data: { title: 'Trailer' },
      restClient,
      session,
    })

    expect(completedSession.status).toBe('completed')
    expect(doc.filesize).toBe(fileBytes.length)

    const download = await restClient.GET(`/${videosSlug}/file/${doc.filename}`)

    expect(download.status).toBe(200)
    expect(Buffer.from(await download.arrayBuffer()).equals(fileBytes)).toBe(true)

    const [blob] = await listBlobs({ prefix: `${uploadSessionsPrefix}/` })

    expect((await head(blob!.url)).contentType).toBe('video/mp4')
  })

  test('should only return missing segments after an interruption', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    const resumed = await getInstructions({ restClient, session })

    expect(resumed.session.completedSegments).toEqual([1])
    expect(resumed.requests.map(({ number }) => number)).toEqual([2, 3])
  })

  test('should accept a segment sent again after its response was lost', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })
    await putSegment({ request: requests[0]!, session })

    const resumed = await getInstructions({ restClient, session })

    expect(resumed.session.completedSegments).toEqual([1])
  })

  test('should stage segments away from the final path and remove them on completion', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    for (const request of requests) {
      expect(new URL(request.url).searchParams.get('pathname')).toMatch(
        new RegExp(`^${stagingPrefix}.+/\\d{5}$`),
      )
    }

    await uploadAllSegments({ restClient, session })

    expect(await listBlobs({ prefix: stagingPrefix })).toHaveLength(3)

    const { doc } = await complete({ data: { title: 'Staged' }, restClient, session })

    expect(await listBlobs({ prefix: stagingPrefix })).toHaveLength(0)
    expect(await listBlobs({ prefix: `${uploadSessionsPrefix}/` })).toHaveLength(1)
    expect(doc.filesize).toBe(fileBytes.length)
  })

  test('should not let a segment token write the stored file or another segment', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await uploadAllSegments({ restClient, session })

    const { doc } = await complete({ data: { title: 'Kept' }, restClient, session })
    const [stored] = await listBlobs({ prefix: `${uploadSessionsPrefix}/` })
    const segmentURL = new URL(requests[0]!.url)

    for (const pathname of [
      stored!.pathname,
      segmentURL.searchParams.get('pathname')!.replace(/1$/, '2'),
    ]) {
      segmentURL.searchParams.set('pathname', pathname)

      const response = await fetch(segmentURL, {
        body: Buffer.from('replaced'),
        headers: requests[0]!.headers,
        method: 'PUT',
      })

      expect(response.status).toBe(400)
    }

    const download = await restClient.GET(`/${videosSlug}/file/${doc.filename}`)

    expect(Buffer.from(await download.arrayBuffer()).equals(fileBytes)).toBe(true)
  })

  test('should finish a completion retried after the final blob was assembled', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    // Simulate a completion that assembled the final blob and removed the staged parts, then lost
    // its response before core recorded it.
    const staged = await listBlobs({ prefix: stagingPrefix })
    const finalPath = staged[0]!.pathname.slice(UPLOAD_STAGING_PREFIX.length).replace(/\/\d+$/, '')

    await put(finalPath, fileBytes, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'video/mp4',
    })
    await del(staged.map(({ url }) => url))

    const { doc } = await complete({ data: { title: 'Assembled earlier' }, restClient, session })

    expect(doc.filesize).toBe(fileBytes.length)
  })

  test('should return a file reference that a normal create request can claim', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const response = await restClient.POST(`${sessionsPath}/${session.id}/storage`)

    expect(response.status).toBe(200)

    const { file } = await response.json<{ file: UploadInstructions['file'] }>()
    const created = await createWithFileReference({ file, restClient, title: 'Form save' })

    expect(created.status).toBe(201)
  })

  test('should resume a browser upload without resending confirmed segments', async ({
    restClient,
  }) => {
    const file = new File([fileBytes], 'browser.mp4', {
      type: 'video/mp4',
      lastModified: 1_700_000_000_000,
    })
    const controller = new AbortController()
    const storagePuts: string[] = []

    await withBrowserFetch({
      onStoragePut: (url) => {
        storagePuts.push(url)

        // Simulate the tab going away after the first segments reach storage.
        if (storagePuts.length === 2) {
          controller.abort()
        }
      },
      restClient,
      run: async () => {
        await expect(
          uploadWithSession({
            apiRoute: '/api',
            collectionSlug: videosSlug,
            file,
            retries: 0,
            serverURL: '',
            signal: controller.signal,
          }),
        ).rejects.toThrow()
      },
    })

    const { docs } = await restClient.GET(sessionsPath).then((res) => res.json())
    const interrupted = docs[0] as ClientUploadSession
    const resumedPuts: string[] = []

    const uploadedFile = await withBrowserFetch({
      onStoragePut: (url) => resumedPuts.push(url),
      restClient,
      run: () =>
        resumeUploadSession({ apiRoute: '/api', file, serverURL: '', session: interrupted }),
    })

    expect(resumedPuts.length).toBeLessThan(interrupted.transfer.segments.length)

    const response = await createWithFileReference({
      file: uploadedFile,
      restClient,
      title: 'Resumed',
    })

    expect(response.status).toBe(201)
  })

  test('should replace the file of an existing document', async ({ restClient }) => {
    const original = await createSession({ restClient })

    await uploadAllSegments({ restClient, session: original })

    const { doc: originalDoc } = await complete({
      data: { title: 'Original' },
      restClient,
      session: original,
    })

    const replacement = await createSession({
      operation: 'update',
      restClient,
      targetID: String(originalDoc.id),
    })

    await uploadAllSegments({ restClient, session: replacement })

    const { doc } = await complete({ data: {}, restClient, session: replacement })

    expect(doc.id).toBe(originalDoc.id)
    expect(doc.title).toBe('Original')
  })

  test('should remove staged segments when the session is cancelled', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    expect(await listBlobs({ prefix: stagingPrefix })).toHaveLength(1)

    const cancelled = await restClient
      .DELETE(`${sessionsPath}/${session.id}`)
      .then((res) => res.json<ClientUploadSession>())

    expect(cancelled.status).toBe('cancelled')
    expect(await listBlobs({ prefix: stagingPrefix })).toHaveLength(0)
    expect(await listBlobs({ prefix: `${uploadSessionsPrefix}/` })).toHaveLength(0)
  })

  test('should refuse a session denied by the adapter clientUploads access rule', async ({
    restClient,
  }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({})),
      headers: { 'x-disallow-access': 'true' },
    })

    expect(response.status).toBe(403)
  })
})

const listBlobs = async ({ prefix }: { prefix: string }) => {
  const blobs: { pathname: string; url: string }[] = []
  let cursor: string | undefined

  do {
    const page = await list({ cursor, prefix })

    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return blobs
}

/** Only this suite's prefixes: the emulator has one store, shared with the other suites. */
const clearBlobs = async () => {
  const blobs = [
    ...(await listBlobs({ prefix: stagingPrefix })),
    ...(await listBlobs({ prefix: `${uploadSessionsPrefix}/` })),
  ]

  if (blobs.length) {
    await del(blobs.map(({ url }) => url))
  }
}

const createBody = ({
  operation = 'create',
  targetID,
}: {
  operation?: 'create' | 'update'
  targetID?: string
}) => ({
  collectionSlug: videosSlug,
  file: {
    filename: 'video.mp4',
    lastModified: 1_700_000_000_000,
    mimeType: 'video/mp4',
    size: fileBytes.length,
  },
  operation,
  targetID,
})

const createSession = async ({
  operation,
  restClient,
  targetID,
}: {
  operation?: 'create' | 'update'
  restClient: RESTClient
  targetID?: string
}): Promise<ClientUploadSession> => {
  const response = await restClient.POST(sessionsPath, {
    body: JSON.stringify(createBody({ operation, targetID })),
  })

  expect(response.status).toBe(201)

  return response.json<ClientUploadSession>()
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
  request,
  session,
}: {
  request: UploadSegmentRequest
  session: ClientUploadSession
}) => {
  const segment = session.transfer.segments.find(({ number }) => number === request.number)!
  const response = await fetch(request.url, {
    body: fileBytes.subarray(segment.start, segment.end),
    headers: request.headers,
    method: request.method,
  })

  expect(response.status).toBe(200)
}

const uploadAllSegments = async ({
  restClient,
  session,
}: {
  restClient: RESTClient
  session: ClientUploadSession
}) => {
  let { requests } = await getInstructions({ restClient, session })

  while (requests.length) {
    await Promise.all(requests.map((request) => putSegment({ request, session })))
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

  return restClient.POST(`/${videosSlug}`, { body: formData })
}

/**
 * Runs the browser uploader against the test server: requests to `/api` go to the in-process
 * Payload handler and segment uploads go straight to Vercel Blob. Restores `fetch` after.
 */
const withBrowserFetch = async <T>({
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
