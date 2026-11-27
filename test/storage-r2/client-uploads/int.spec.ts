import type { UploadInstructions, UploadTransferProgress } from 'payload'

import { randomBytes } from 'node:crypto'
import { expect } from 'vitest'

import type { RESTClient } from '../../__helpers/shared/RESTClient.js'

import { handleR2Upload } from '../../../packages/storage-r2/src/client/handleR2Upload.js'
import { test } from '../../__helpers/int/vitest.js'
import { mediaClientSlug } from '../shared.js'
import { r2Environment } from './config.js'

const MiB = 1024 * 1024
// R2 needs every part but the last to be at least 5 MiB, so this file is sent as 5 + 5 + 1.
const chunkSize = 5 * MiB
const fileBytes = randomBytes(11 * MiB)
const endpointPath = '/storage-r2-multi-part-upload'
const bucket = r2Environment.env.R2

test.suite('@payloadcms/storage-r2 client uploads', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await clearBucket()
  })

  test.afterAll(async () => {
    await r2Environment.dispose()
  })

  test('should send a file in parts, report progress per part and complete the upload', async ({
    restClient,
  }) => {
    await restClient.login({ slug: 'users' })

    const file = createFile()
    const progress: UploadTransferProgress[] = []

    await getUploadInstructions({ file, restClient })

    const uploadReference = await withBrowserFetch({
      restClient,
      run: () => uploadToR2({ file, onProgress: (value) => progress.push(value) }),
    })
    const objects = await listObjects()

    // Node has no XMLHttpRequest, so `uploadRequest` reports each part once it is sent.
    expect(progress).toEqual([
      { loadedBytes: 5 * MiB, totalBytes: fileBytes.length },
      { loadedBytes: 10 * MiB, totalBytes: fileBytes.length },
      { loadedBytes: 11 * MiB, totalBytes: fileBytes.length },
    ])
    expect(uploadReference).toEqual({
      prefix: expect.any(String),
      signedReceipt: expect.any(String),
    })
    expect(objects).toEqual([{ key: expect.stringMatching(/data\.bin$/), size: fileBytes.length }])
  })

  test('should stop at a rejected part without completing the upload', async ({ restClient }) => {
    await restClient.login({ slug: 'users' })

    const file = createFile()
    const completionRequests: string[] = []

    await getUploadInstructions({ file, restClient })

    await expect(
      withBrowserFetch({
        onRequest: ({ url }) => {
          const params = new URL(url, 'http://localhost').searchParams

          if (params.get('multipartNumber') === '2') {
            return new Response(null, { status: 500 })
          }

          if (params.has('multipartId') && !params.has('multipartNumber')) {
            completionRequests.push(url)
          }
        },
        restClient,
        run: () => uploadToR2({ file }),
      }),
    ).rejects.toThrow('Failed to upload part 2 / 3')

    const objects = await listObjects()

    expect(completionRequests).toEqual([])
    expect(objects).toEqual([])
  })
})

const createFile = () => new File([fileBytes], 'data.bin', { type: 'application/octet-stream' })

const getUploadInstructions = async ({
  file,
  restClient,
}: {
  file: File
  restClient: RESTClient
}): Promise<UploadInstructions> => {
  const response = await restClient.POST('/upload-instructions', {
    body: JSON.stringify({
      collectionSlug: mediaClientSlug,
      filename: file.name,
      filesize: file.size,
      mimeType: file.type,
    }),
  })

  expect(response.status).toBe(200)

  return response.json<UploadInstructions>()
}

const uploadToR2 = ({
  file,
  onProgress,
}: {
  file: File
  onProgress?: (progress: UploadTransferProgress) => void
}) =>
  handleR2Upload({
    apiRoute: '/api',
    collectionSlug: mediaClientSlug,
    endpointPath,
    file,
    onProgress,
    props: { chunkSize },
    serverURL: '',
    updateFilename: () => {},
  })

/**
 * Runs browser upload code with `fetch` routed like a browser would: `/api` requests go to the
 * in-process Payload handler. `onRequest` can answer a request itself, e.g. to fail one part.
 * Restores `fetch` after.
 */
const withBrowserFetch = async <T>({
  onRequest,
  restClient,
  run,
}: {
  onRequest?: (args: { url: string }) => Response | undefined
  restClient: RESTClient
  run: () => Promise<T>
}): Promise<T> => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const answer = onRequest?.({ url })

    if (answer) {
      return answer
    }

    if (!url.startsWith('/api/')) {
      return originalFetch(input, init)
    }

    const path = url.slice('/api'.length) as `/${string}`
    const { body, headers, method = 'GET' } = init

    return method === 'POST'
      ? restClient.POST(path, { body: body ?? undefined, headers })
      : restClient.GET(path, { headers })
  }

  try {
    return await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

const clearBucket = async () => {
  const objects = await listObjects()

  if (objects.length) {
    await bucket.delete(objects.map(({ key }) => key))
  }
}

/** The bucket's objects. The R2 binding types `list` loosely. */
const listObjects = async (): Promise<{ key: string; size: number }[]> => {
  const { objects } = (await bucket.list()) as { objects: { key: string; size: number }[] }

  return objects.map(({ key, size }) => ({ key, size }))
}
