/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options", "test.for", "test.each"] }] -- Tests use the shared fixture wrapper. */
import type { ClientUploadSession, UploadInstructions, UploadSegmentRequest } from 'payload'

import {
  AbortMultipartUploadCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { randomBytes } from 'node:crypto'
import { uploadSessionsCollectionSlug } from 'payload/internal'
import { expect } from 'vitest'

import type { RESTClient } from '../../__helpers/shared/RESTClient.js'

/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the real browser uploader, which is not exported. */
import {
  resumeUploadSession,
  uploadWithSession,
} from '../../../packages/ui/src/utilities/uploadWithSession.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../../__helpers/int/vitest.js'
import { RESTClient as RESTClientClass } from '../../__helpers/shared/RESTClient.js'
import { regularUser } from '../../credentials.js'
import { videosMissingBucketSlug, videosSlug, videosWithDraftsSlug } from '../shared.js'
import {
  clearTestBucket,
  createTestBucket,
  getAWSClient,
  getTestBucketName,
  MB,
} from '../test-utils.js'
import { maxActiveSessions } from './config.js'

const sessionsPath = `/${uploadSessionsCollectionSlug}` as const

// Three S3 parts at the 5 MiB minimum: 5 + 5 + 1.
const fileBytes = randomBytes(MB(11))

test.suite('@payloadcms/storage-s3 upload sessions', { config: './config.ts' }, () => {
  test.beforeEach(async () => {
    await createTestBucket()
    await clearTestBucket()
    await abortMultipartUploads()
  })

  test('should upload a file in segments and create the document on completion', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    expect(session.status).toBe('pending')
    expect(session.transfer.segments).toHaveLength(3)
    expect(session).not.toHaveProperty('storage')

    await uploadAllSegments({ restClient, session })

    const { doc, session: completedSession } = await complete({
      data: { title: 'Trailer' },
      restClient,
      session,
    })

    expect(completedSession.status).toBe('completed')
    expect(completedSession.documentID).toBe(String(doc.id))
    expect(doc.filesize).toBe(fileBytes.length)

    const download = await restClient.GET(`/${videosSlug}/file/${doc.filename}`)

    expect(download.status).toBe(200)
    expect(Buffer.from(await download.arrayBuffer()).equals(fileBytes)).toBe(true)
  })

  test('should only return missing segments after an interruption', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    const resumed = await getInstructions({ restClient, session })

    expect(resumed.session.completedSegments).toEqual([1])
    expect(resumed.requests.map(({ number }) => number)).toEqual([2, 3])
  })

  test('should reject completion while segments are missing', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    const response = await restClient.POST(`${sessionsPath}/${session.id}/complete`, {
      body: JSON.stringify({ data: { title: 'Incomplete' } }),
    })

    expect(response.status).toBe(409)
  })

  test('should return the same document when completion is retried', async ({
    payload,
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const first = await complete({ data: { title: 'Once' }, restClient, session })
    const second = await complete({ data: { title: 'Twice' }, restClient, session })

    expect(second.doc.id).toBe(first.doc.id)
    expect((await payload.count({ collection: videosSlug })).totalDocs).toBe(1)
  })

  test('should let only one of two concurrent completions finalize', async ({
    payload,
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const responses = await Promise.all(
      ['A', 'B'].map((title) =>
        restClient.POST(`${sessionsPath}/${session.id}/complete`, {
          body: JSON.stringify({ data: { title } }),
        }),
      ),
    )

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409])
    expect((await payload.count({ collection: videosSlug })).totalDocs).toBe(1)
  })

  test('should keep the stored object when document validation fails', async ({ restClient }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const failed = await restClient.POST(`${sessionsPath}/${session.id}/complete`, {
      body: JSON.stringify({ data: {} }),
    })

    expect(failed.status).toBe(400)

    const afterFailure = await getSession({ restClient, session })

    expect(afterFailure.status).toBe('pending')
    expect(afterFailure.isStorageComplete).toBe(true)
    expect(afterFailure.error?.retryable).toBe(true)

    const { doc } = await complete({ data: { title: 'Fixed' }, restClient, session })

    expect(doc.title).toBe('Fixed')
  })

  test('should finish a save with the stored intent', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const withIntent = await setIntent({ data: { title: 'Saved early' }, restClient, session })

    expect(withIntent.status).toBe(200)
    expect((await withIntent.json<ClientUploadSession>()).hasIntent).toBe(true)

    await uploadAllSegments({ restClient, session })

    const response = await restClient.POST(`${sessionsPath}/${session.id}/complete`)

    expect(response.status).toBe(200)

    const { doc, session: completedSession } = await response.json()

    expect(doc.title).toBe('Saved early')
    expect(completedSession.hasIntent).toBe(false)
  })

  test('should require document data when no intent is stored', async ({ restClient }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const response = await restClient.POST(`${sessionsPath}/${session.id}/complete`)

    expect(response.status).toBe(400)
  })

  test('should reject an oversized intent', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const response = await setIntent({
      data: { title: 'x'.repeat(300 * 1024) },
      restClient,
      session,
    })

    expect(response.status).toBe(413)
  })

  test('should discard the intent when the session is cancelled', async ({ restClient }) => {
    const session = await createSession({ restClient })

    await setIntent({ data: { title: 'Never saved' }, restClient, session })

    const cancelled = (await restClient
      .DELETE(`${sessionsPath}/${session.id}`)
      .then((res) => res.json())) as ClientUploadSession

    expect(cancelled.hasIntent).toBe(false)
  })

  test('should not let another user store an intent', async ({ payload, restClient }) => {
    const session = await createSession({ restClient })
    const otherUser = new RESTClientClass(payload.config)

    await otherUser.login({ slug: 'users', credentials: regularUser })

    const response = await setIntent({ data: { title: 'Hijack' }, restClient: otherUser, session })

    expect(response.status).toBe(404)
  })

  test('should return a file reference that a normal create request can claim', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const { file } = await completeStorage({ restClient, session })
    const response = await createWithFileReference({ file, restClient, title: 'Form submit' })

    expect(response.status).toBe(201)

    const { doc } = await response.json()
    const completedSession = await getSession({ restClient, session })

    expect(completedSession.status).toBe('completed')
    expect(completedSession.documentID).toBe(String(doc.id))
  })

  test('should not create a duplicate when a form submit is retried', async ({
    payload,
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const { file } = await completeStorage({ restClient, session })

    await createWithFileReference({ file, restClient, title: 'First' })
    const retry = await createWithFileReference({ file, restClient, title: 'Retry' })

    expect(retry.status).toBe(400)
    expect((await payload.count({ collection: videosSlug })).totalDocs).toBe(1)
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

    const stillServed = await restClient.GET(`/${videosSlug}/file/${originalDoc.filename}`)

    expect(stillServed.status).toBe(200)

    const { doc } = await complete({ data: {}, restClient, session: replacement })

    expect(doc.id).toBe(originalDoc.id)
    expect(doc.title).toBe('Original')
    expect(doc.filename).not.toBe(originalDoc.filename)
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

        // Simulate the tab going away after the first segment reaches storage.
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
    const progress: number[] = []

    const uploadedFile = await withBrowserFetch({
      onStoragePut: (url) => resumedPuts.push(url),
      restClient,
      run: () =>
        resumeUploadSession({
          apiRoute: '/api',
          file,
          onProgress: ({ loaded }) => progress.push(loaded),
          serverURL: '',
          session: interrupted,
        }),
    })

    expect(resumedPuts.length).toBeLessThan(interrupted.transfer.segments.length)
    expect(progress.at(-1)).toBe(fileBytes.length)

    const response = await createWithFileReference({
      file: uploadedFile,
      restClient,
      title: 'Resumed',
    })

    expect(response.status).toBe(201)
  })

  test('should reserve the filename for the whole session', async ({ payload, restClient }) => {
    const first = await createSession({ restClient })
    const second = await createSession({ restClient })

    expect(first.file.filename).toBe('video.mp4')
    expect(second.file.filename).toBe('video-1.mp4')

    // A server-side upload during the session also avoids the reserved name.
    const serverUpload = await payload.create({
      collection: videosSlug,
      data: { title: 'Server upload' },
      file: { name: 'video.mp4', data: Buffer.from('small'), mimetype: 'video/mp4', size: 5 },
      overrideAccess: true,
    })

    expect(serverUpload.filename).not.toBe('video.mp4')

    await uploadAllSegments({ restClient, session: first })

    const { doc } = await complete({ data: { title: 'Kept its name' }, restClient, session: first })

    // Client-uploaded documents store the retained original's name.
    expect(doc.filename).toBe('video-original.mp4')
  })

  test('should give two sessions started at the same moment different filenames', async ({
    restClient,
  }) => {
    const sessions = await Promise.all([
      createSession({ restClient }),
      createSession({ restClient }),
    ])
    const filenames = sessions.map(({ file }) => file.filename)

    expect(new Set(filenames).size).toBe(2)
    expect(filenames).toContain('video.mp4')
  })

  test('should start one provider upload when instructions are requested concurrently', async ({
    payload,
    restClient,
  }) => {
    const session = await createSession({ restClient })

    // Return the session to its state after a temporary initiation failure.
    await abortMultipartUploads()
    await payload.db.updateOne({
      id: session.id,
      collection: uploadSessionsCollectionSlug,
      data: { reservedFilename: null, storage: { object: null, providerState: null } },
    })

    const responses = await Promise.all(
      [1, 2, 3].map(() => restClient.POST(`${sessionsPath}/${session.id}/instructions`)),
    )
    const statuses = responses.map(({ status }) => status)

    expect(statuses).toContain(200)
    expect(statuses.every((status) => status === 200 || status === 409)).toBe(true)

    const { Uploads } = await getAWSClient().send(
      new ListMultipartUploadsCommand({ Bucket: getTestBucketName() }),
    )

    expect(Uploads ?? []).toHaveLength(1)
  })

  test('should keep a file saved into a draft when its session is cancelled', async ({
    restClient,
  }) => {
    const original = await createSession({ collectionSlug: videosWithDraftsSlug, restClient })

    await uploadAllSegments({ restClient, session: original })

    const { doc: published } = await complete({
      data: { _status: 'published', title: 'Published' },
      restClient,
      session: original,
    })

    const replacement = await createSession({
      collectionSlug: videosWithDraftsSlug,
      operation: 'update',
      restClient,
      targetID: String(published.id),
    })

    await uploadAllSegments({ restClient, session: replacement })

    const { file } = await completeStorage({ restClient, session: replacement })
    const formData = new FormData()

    formData.append('_payload', JSON.stringify({ _status: 'draft' }))
    formData.append('file', JSON.stringify(file))

    const draftSave = await restClient.PATCH(
      `/${videosWithDraftsSlug}/${published.id}?draft=true`,
      { body: formData },
    )

    expect(draftSave.status).toBe(200)

    // The draft lives only in the versions table; the session must still count as claimed.
    const cancel = await restClient.DELETE(`${sessionsPath}/${replacement.id}`)

    expect(cancel.status).toBe(409)
    expect((await getSession({ restClient, session: replacement })).documentID).toBe(
      String(published.id),
    )

    // Both the published file and the draft's replacement are still stored.
    const { Contents = [] } = await getAWSClient().send(
      new ListObjectsV2Command({ Bucket: getTestBucketName() }),
    )

    expect(Contents.filter(({ Size }) => Size === fileBytes.length)).toHaveLength(2)
  })

  test('should release the filename when the session is cancelled', async ({ restClient }) => {
    const first = await createSession({ restClient })

    await restClient.DELETE(`${sessionsPath}/${first.id}`)

    const second = await createSession({ restClient })

    expect(second.file.filename).toBe('video.mp4')
  })

  test('should count expiry from creation, not from activity', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })
    await setIntent({ data: { title: 'Still uploading' }, restClient, session })
    await getInstructions({ restClient, session })

    expect((await getSession({ restClient, session })).expiresAt).toBe(session.expiresAt)
  })

  test('should expire overdue sessions and abort their multipart upload', async ({
    payload,
    restClient,
  }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })
    await payload.db.updateOne({
      id: session.id,
      collection: uploadSessionsCollectionSlug,
      data: { expiresAt: new Date(Date.now() - 1000).toISOString() },
    })

    // Listing runs the cleanup sweep.
    const { docs } = await restClient.GET(sessionsPath).then((res) => res.json())

    expect(docs).toHaveLength(0)

    const expired = await payload.db.findOne<{
      cancelReason: string
      cleanupCompletedAt?: string
      status: string
    }>({
      collection: uploadSessionsCollectionSlug,
      where: { id: { equals: session.id } },
    })

    expect(expired).toMatchObject({ cancelReason: 'expired', status: 'cancelled' })
    expect(expired?.cleanupCompletedAt).toBeTruthy()

    const { Uploads } = await getAWSClient().send(
      new ListMultipartUploadsCommand({ Bucket: getTestBucketName() }),
    )

    expect(Uploads ?? []).toHaveLength(0)
  })

  test('should abort the provider upload when cancelled', async ({ restClient }) => {
    const session = await createSession({ restClient })

    const cancelled = (await restClient
      .DELETE(`${sessionsPath}/${session.id}`)
      .then((res) => res.json())) as ClientUploadSession

    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.cancelReason).toBe('user')

    const instructions = await restClient.POST(`${sessionsPath}/${session.id}/instructions`)

    expect(instructions.status).toBe(409)

    const { Uploads } = await getAWSClient().send(
      new ListMultipartUploadsCommand({ Bucket: getTestBucketName() }),
    )

    expect(Uploads ?? []).toHaveLength(0)
  })

  test('should hide sessions from other users', async ({ payload, restClient }) => {
    const session = await createSession({ restClient })
    const otherUser = new RESTClientClass(payload.config)

    await otherUser.login({ slug: 'users', credentials: regularUser })

    const response = await otherUser.GET(`${sessionsPath}/${session.id}`)
    const list = await otherUser.GET(sessionsPath).then((res) => res.json())

    expect(response.status).toBe(404)
    expect(list.docs).toHaveLength(0)
  })

  test('should limit unfinished sessions per user', async ({ restClient }) => {
    for (let i = 0; i < maxActiveSessions; i++) {
      await createSession({ restClient })
    }

    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({})),
    })

    expect(response.status).toBe(429)
  })

  test('should keep generic CRUD closed', async ({ restClient }) => {
    const session = await createSession({ restClient })

    const update = await restClient.PATCH(`${sessionsPath}/${session.id}`, {
      body: JSON.stringify({ status: 'completed' }),
    })

    expect(update.status).toBe(403)
  })

  test('should refuse a session denied by the adapter clientUploads access rule', async ({
    payload,
    restClient,
  }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({})),
      headers: { 'x-disallow-access': 'true' },
    })

    expect(response.status).toBe(403)
    // The Local API would apply the collection's deny-all access, so read through the adapter.
    expect((await payload.db.count({ collection: uploadSessionsCollectionSlug })).totalDocs).toBe(0)
  })

  test('should re-check the adapter access rule on later session actions', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    const instructions = await restClient.POST(`${sessionsPath}/${session.id}/instructions`, {
      headers: { 'x-disallow-access': 'true' },
    })

    expect(instructions.status).toBe(403)
  })

  test('should free the quota slot when initiation fails permanently', async ({
    payload,
    restClient,
  }) => {
    for (let i = 0; i < maxActiveSessions; i++) {
      const response = await restClient.POST(sessionsPath, {
        body: JSON.stringify(createBody({})),
        headers: { 'x-fail-initiate': 'permanent' },
      })

      expect(response.status).toBe(400)
    }

    const { docs } = await payload.db.find<ClientUploadSession>({
      collection: uploadSessionsCollectionSlug,
    })

    expect(docs.map(({ status }) => status)).toEqual(['failed', 'failed', 'failed'])

    // Creating a session runs the cleanup sweep, which also finishes failed sessions.
    await createSession({ restClient })

    const { docs: failedSessions } = await payload.db.find<{ cleanupCompletedAt?: string }>({
      collection: uploadSessionsCollectionSlug,
      where: { status: { equals: 'failed' } },
    })

    expect(failedSessions.every(({ cleanupCompletedAt }) => Boolean(cleanupCompletedAt))).toBe(true)
  })

  test('should fail permanently when S3 rejects the upload', async ({ payload, restClient }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify({ ...createBody({}), collectionSlug: videosMissingBucketSlug }),
    })

    expect(response.status).toBe(404)

    const { docs } = await payload.db.find<ClientUploadSession>({
      collection: uploadSessionsCollectionSlug,
    })

    expect(docs[0]?.status).toBe('failed')
    expect(docs[0]?.error?.retryable).toBe(false)
  })

  test('should not expose sessions through GraphQL', async ({ restClient }) => {
    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({ query: '{ PayloadUploadSessions { docs { id } } }' }),
    })
    const { errors } = await response.json()

    expect(errors?.[0]?.message).toContain('Cannot query field')
  })

  test('should keep a session pending when initiation fails temporarily', async ({
    restClient,
  }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({})),
      headers: { 'x-fail-initiate': 'temporary' },
    })

    expect(response.status).toBe(201)

    const session = await response.json<ClientUploadSession>()

    expect(session.status).toBe('pending')
    expect(session.error?.retryable).toBe(true)

    const { requests } = await getInstructions({ restClient, session })

    expect(requests).toHaveLength(3)
  })

  test('should enforce collection create access', async ({ restClient }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({})),
      headers: { 'x-disallow-create': 'true' },
    })

    expect(response.status).toBe(403)
  })

  test('should reject file types that need server validation', async ({ restClient }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({ filename: 'vector.svg', mimeType: 'image/svg+xml' })),
    })

    expect(response.status).toBe(400)
  })
})

/**
 * Runs browser upload code with `fetch` routed like a browser would: session API calls go to the
 * in-process Payload handler and segment uploads go straight to storage. Restores `fetch` after.
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

/** Interrupted uploads leave multipart state that clearing objects does not remove. */
const abortMultipartUploads = async () => {
  const client = getAWSClient()
  const { Uploads = [] } = await client.send(
    new ListMultipartUploadsCommand({ Bucket: getTestBucketName() }),
  )

  for (const { Key, UploadId } of Uploads) {
    await client.send(
      new AbortMultipartUploadCommand({ Bucket: getTestBucketName(), Key, UploadId }),
    )
  }
}

const createBody = ({
  collectionSlug = videosSlug,
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

  return response.json<ClientUploadSession>()
}

const getSession = ({
  restClient,
  session,
}: {
  restClient: RESTClient
  session: ClientUploadSession
}): Promise<ClientUploadSession> =>
  restClient.GET(`${sessionsPath}/${session.id}`).then((res) => res.json<ClientUploadSession>())

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

const setIntent = ({
  data,
  restClient,
  session,
}: {
  data: Record<string, unknown>
  restClient: RESTClient
  session: ClientUploadSession
}) => restClient.POST(`${sessionsPath}/${session.id}/intent`, { body: JSON.stringify({ data }) })

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

  return restClient.POST(`/${videosSlug}`, { body: formData })
}
