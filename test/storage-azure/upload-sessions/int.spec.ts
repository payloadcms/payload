/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options", "test.for", "test.each"] }] -- Tests use the shared fixture wrapper. */
import type { ContainerClient } from '@azure/storage-blob'
import type { ClientUploadSession, UploadInstructions } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import { randomBytes } from 'node:crypto'
import { UPLOAD_STAGING_PREFIX, uploadSessionsCollectionSlug } from 'payload/internal'
import { expect } from 'vitest'

/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the real browser uploader, which is not exported. */
import {
  resumeUploadSession,
  uploadWithSession,
} from '../../../packages/ui/src/utilities/uploadWithSession.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { createUploadSessionHelpers, withBrowserFetch } from '../../__helpers/int/uploadSessions.js'
import { test } from '../../__helpers/int/vitest.js'
import { videosMissingContainerSlug, videosSlug } from '../shared.js'
import { uploadSessionsContainerName } from './config.js'

const sessionsPath = `/${uploadSessionsCollectionSlug}` as const

// Three 5 MiB blocks: 5 + 5 + 1.
const fileBytes = randomBytes(11 * 1024 * 1024)

const {
  complete,
  createBody,
  createSession,
  createWithFileReference,
  getInstructions,
  putSegment,
  uploadAllSegments,
} = createUploadSessionHelpers({
  collectionSlug: videosSlug,
  fileBytes,
  // Put Block answers 201 Created.
  segmentUploadStatus: 201,
})

let containerClient: ContainerClient

test.suite('@payloadcms/storage-azure upload sessions', { config: './config.ts' }, () => {
  test.beforeEach(async () => {
    containerClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    ).getContainerClient(uploadSessionsContainerName)

    await containerClient.createIfNotExists()

    // Blobs with only uncommitted blocks cannot be deleted directly; committing an empty list
    // first turns them into empty blobs.
    for (const blob of await listBlobs({ includeUncommitted: true })) {
      const blobClient = containerClient.getBlockBlobClient(blob.name)

      await blobClient.commitBlockList([]).catch(() => undefined)
      await blobClient.deleteIfExists()
    }
  })

  test('should upload a file in blocks and create the document on completion', async ({
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

    const [blob] = await listBlobs()

    expect(blob?.properties.contentType).toBe('video/mp4')
  })

  test('should only return missing blocks after an interruption', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    const resumed = await getInstructions({ restClient, session })

    expect(resumed.session.completedSegments).toEqual([1])
    expect(resumed.requests.map(({ number }) => number)).toEqual([2, 3])
  })

  test('should stage blocks away from the final path and remove them on completion', async ({
    restClient,
  }) => {
    const session = await createSession({ restClient })

    await uploadAllSegments({ restClient, session })

    const [staged] = await listBlobs({ includeUncommitted: true })

    expect(staged?.name.startsWith(UPLOAD_STAGING_PREFIX)).toBe(true)

    const { doc } = await complete({ data: { title: 'Staged' }, restClient, session })
    const blobs = await listBlobs({ includeUncommitted: true })

    expect(blobs.map(({ name }) => name)).toEqual([
      staged!.name.slice(UPLOAD_STAGING_PREFIX.length),
    ])
    expect(doc.filesize).toBe(fileBytes.length)
  })

  test('should not let an unexpired block URL change the stored file', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await Promise.all(requests.map((request) => putSegment({ request, session })))

    const { doc } = await complete({ data: { title: 'Kept' }, restClient, session })

    // A write SAS allows Put Blob on the blob it names, but that is only the staging blob.
    // Drop the block parameters so the request is a Put Blob, which commits immediately.
    const putBlobURL = new URL(requests[0]!.url)

    putBlobURL.searchParams.delete('comp')
    putBlobURL.searchParams.delete('blockid')

    const response = await fetch(putBlobURL, {
      body: Buffer.from('replaced'),
      headers: { 'x-ms-blob-type': 'BlockBlob' },
      method: 'PUT',
    })

    expect(response.status).toBe(201)

    const download = await restClient.GET(`/${videosSlug}/file/${doc.filename}`)

    expect(Buffer.from(await download.arrayBuffer()).equals(fileBytes)).toBe(true)
  })

  test('should finish a completion retried after the blob was copied', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await Promise.all(requests.map((request) => putSegment({ request, session })))

    // Simulate a completion that copied the blob and removed the staging blob, then lost its
    // response before core recorded it.
    const [staged] = await listBlobs({ includeUncommitted: true })
    const stagingBlob = containerClient.getBlockBlobClient(staged!.name)
    const finalBlob = containerClient.getBlockBlobClient(
      staged!.name.slice(UPLOAD_STAGING_PREFIX.length),
    )
    const { uncommittedBlocks = [] } = await stagingBlob.getBlockList('uncommitted')

    await stagingBlob.commitBlockList(uncommittedBlocks.map(({ name }) => name).sort(), {
      blobHTTPHeaders: { blobContentType: 'video/mp4' },
    })
    await (await finalBlob.beginCopyFromURL(stagingBlob.url)).pollUntilDone()
    await stagingBlob.delete()

    const { doc } = await complete({ data: { title: 'Copied earlier' }, restClient, session })

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

  test('should resume a browser upload without resending confirmed blocks', async ({
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

        // Simulate the tab going away after the first blocks reach storage.
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

  test('should discard staged blocks when the session is cancelled', async ({ restClient }) => {
    const session = await createSession({ restClient })
    const { requests } = await getInstructions({ restClient, session })

    await putSegment({ request: requests[0]!, session })

    const cancelled = await restClient
      .DELETE(`${sessionsPath}/${session.id}`)
      .then((res) => res.json<ClientUploadSession>())

    expect(cancelled.status).toBe('cancelled')
    expect(await listBlobs({ includeUncommitted: true })).toHaveLength(0)
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

  test('should fail permanently when the container does not exist', async ({
    payload,
    restClient,
  }) => {
    const response = await restClient.POST(sessionsPath, {
      body: JSON.stringify(createBody({ collectionSlug: videosMissingContainerSlug })),
    })

    expect(response.status).toBe(404)

    const { docs } = await payload.db.find<ClientUploadSession>({
      collection: uploadSessionsCollectionSlug,
    })

    expect(docs[0]?.status).toBe('failed')
    expect(docs[0]?.error?.retryable).toBe(false)
  })
})

const listBlobs = async ({ includeUncommitted = false }: { includeUncommitted?: boolean } = {}) => {
  const blobs = []

  for await (const blob of containerClient.listBlobsFlat({
    includeUncommitedBlobs: includeUncommitted,
  })) {
    blobs.push(blob)
  }

  return blobs
}
