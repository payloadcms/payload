import type {
  CollectionConfig,
  ReconciledSegments,
  ReservedObject,
  SegmentedUploadCapability,
  UploadInstructionsAccess,
  UploadSessionTransferConfig,
} from 'payload'

import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import {
  BlobAccessError,
  BlobNotFoundError,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  completeMultipartUpload,
  createMultipartUpload,
  del,
  head,
  list,
  uploadPart,
} from '@vercel/blob'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { APIError, Forbidden } from 'payload'
import { planSegments } from 'payload/internal'

import { buildBlobUrl } from './generateURL.js'

const MiB = 1024 * 1024

/**
 * Parts are staged as separate blobs under this prefix and assembled into the final blob at
 * completion. Vercel Blob multipart uploads have no call that lists uploaded parts, so the server
 * could not tell which parts the browser sent; staged blobs can be listed instead.
 */
export const UPLOAD_STAGING_PREFIX = 'payload-upload-sessions/'

/** Fits `maximumSegmentCount`, so staged parts sort and parse by name. */
const PART_NUMBER_DIGITS = 5

/** The REST API version `@vercel/blob` sends. Browser requests skip the SDK, so they send it themselves. */
const BLOB_API_VERSION = '12'

const DEFAULT_BLOB_API_URL = 'https://vercel.com/api/blob'

/** Staged parts are read once at completion, so they never need a long CDN lifetime. */
const STAGING_CACHE_CONTROL_MAX_AGE = 60

/** Staged parts the server reads and uploads at once while assembling the final blob. */
const COMPLETION_CONCURRENCY = 4

const DELETE_BATCH_SIZE = 100

type Args = {
  access?: UploadInstructionsAccess
  baseUrl: string
  blobAccess: 'public'
  cacheControlMaxAge: number
  collection: CollectionConfig
  collectionPrefix: string
  token: string
  useCompositePrefixes?: boolean
}

type VercelBlobProviderState = {
  contentType: string
  /** The transfer settings core planned segments with, so the plan can be rebuilt later. */
  transfer: {
    collection?: UploadSessionTransferConfig
    global?: UploadSessionTransferConfig
  }
}

/**
 * Vercel Blob uploads for durable upload sessions. The browser uploads each segment straight to
 * Vercel Blob as a staged blob, with a client token scoped to that one pathname. The server
 * reconciles progress by listing staged blobs, then assembles them into the final blob with a
 * multipart upload, so no segment passes through a function request body.
 */
export const createSegmentedUpload = ({
  access,
  baseUrl,
  blobAccess,
  cacheControlMaxAge,
  collection,
  collectionPrefix,
  token,
  useCompositePrefixes = false,
}: Args): SegmentedUploadCapability => {
  const limits: SegmentedUploadCapability['limits'] = {
    maximumConcurrency: 8,
    maximumObjectSize: 10_000 * 64 * MiB,
    maximumSegmentCount: 10_000,
    // Completion holds `COMPLETION_CONCURRENCY` segments in memory at once.
    maximumSegmentSize: 64 * MiB,
    // Staged parts become multipart parts, which Vercel Blob requires to be 5MiB or more.
    minimumSegmentSize: 5 * MiB,
    segmentSizeGranularity: 1,
  }

  const deleteStagedParts = async ({ object }: { object: ReservedObject }) => {
    const urls = (await listStagedParts({ object, token })).map(({ url }) => url)

    for (let index = 0; index < urls.length; index += DELETE_BATCH_SIZE) {
      await del(urls.slice(index, index + DELETE_BATCH_SIZE), { token })
    }
  }

  return {
    abort: async ({ object }) => {
      await deleteStagedParts({ object })

      // Core only aborts unclaimed sessions, so a completed final blob here is an orphan.
      // A multipart upload that never completed has no delete call; Vercel Blob discards it.
      if ((await getSize({ pathname: object.storageFilePath, token })) !== null) {
        await del(object.storageFilePath, { token })
      }
    },

    authorize: async ({ collectionSlug, req }) => {
      if (access ? !(await access({ collectionSlug, req })) : !req.user) {
        throw new Forbidden(req.t)
      }
    },

    complete: async ({ object, providerState, segments }) => {
      const finalPath = object.storageFilePath
      const existingSize = await getSize({ pathname: finalPath, token })

      // A retry after a lost response: the final blob was already assembled.
      if (existingSize !== null) {
        await deleteStagedParts({ object })

        return { size: existingSize }
      }

      const { contentType } = providerState as VercelBlobProviderState
      const blobOptions = {
        access: blobAccess,
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge,
        contentType,
        token,
      }

      const { key, uploadId } = await createMultipartUpload(finalPath, blobOptions)
      const sortedSegments = [...segments].sort((a, b) => a.number - b.number)

      const parts = await mapWithConcurrency({
        concurrency: COMPLETION_CONCURRENCY,
        items: sortedSegments,
        mapper: async ({ number, size }) => {
          const body = await readStagedPart({ baseUrl, number, object, size })

          return uploadPart(finalPath, body, {
            access: blobAccess,
            key,
            partNumber: number,
            token,
            uploadId,
          })
        },
      })

      await completeMultipartUpload(finalPath, parts, { ...blobOptions, key, uploadId })
      await deleteStagedParts({ object })

      const size = await getSize({ pathname: finalPath, token })

      if (size === null) {
        throw new Error('Vercel Blob did not store the assembled upload.')
      }

      return { size }
    },

    getSegmentRequests: ({ expiresIn, object, segments }) =>
      Promise.all(
        segments.map(async ({ end, number, start }) => {
          const pathname = getStagedPartPath({ number, object })
          const clientToken = await generateClientTokenFromReadWriteToken({
            addRandomSuffix: false,
            // A segment whose response was lost is sent again with the same bytes.
            allowOverwrite: true,
            cacheControlMaxAge: STAGING_CACHE_CONTROL_MAX_AGE,
            maximumSizeInBytes: end - start,
            pathname,
            token,
            validUntil: Date.now() + expiresIn * 1000,
          })

          return {
            headers: {
              authorization: `Bearer ${clientToken}`,
              'x-api-version': BLOB_API_VERSION,
              'x-content-type': 'application/octet-stream',
              'x-vercel-blob-access': blobAccess,
            },
            method: 'PUT' as const,
            number,
            url: `${getBlobApiUrl()}/?${new URLSearchParams({ pathname }).toString()}`,
          }
        }),
      ),

    initiate: async ({ collectionSlug, docPrefix, filename, mimeType, req }) => {
      const { sanitizedFilename, storageFilePath, uploadReference } = await resolveSignedURLKey({
        collectionPrefix,
        collectionSlug,
        docPrefix,
        filename,
        req,
        useCompositePrefixes,
      })

      if (!uploadReference._objectKey) {
        throw new Error('Vercel Blob upload could not be initiated.')
      }

      const object: ReservedObject = {
        _objectKey: uploadReference._objectKey,
        filename: sanitizedFilename,
        prefix: uploadReference.prefix,
        storageFilePath,
      }

      // Segments are signed offline, so check the store up front: a revoked token or missing
      // store would otherwise only surface after the browser started sending segments.
      await withPermanentErrors({
        operation: () => list({ limit: 1, prefix: getStagingPrefix({ object }), token }),
      })

      const upload = typeof collection.upload === 'object' ? collection.upload : undefined

      return {
        object,
        providerState: {
          contentType: mimeType,
          transfer: { collection: upload?.transfer, global: req.payload.config.upload?.transfer },
        } satisfies VercelBlobProviderState,
      }
    },

    limits,

    reconcile: async ({ object, providerState }) => {
      const finalSize = await getSize({ pathname: object.storageFilePath, token })

      // Once the final blob is assembled it holds every segment, even if core did not record the
      // completion or some staged parts were not removed. The plan core froze is rebuilt from the
      // settings it was made with; `complete` then removes any staged parts left over.
      if (finalSize !== null) {
        const { transfer } = providerState as VercelBlobProviderState

        return planSegments({
          collectionTransfer: transfer.collection,
          globalTransfer: transfer.global,
          limits,
          size: finalSize,
        }).segments.map(({ end, number, start }) => ({ number, size: end - start }))
      }

      return (await listStagedParts({ object, token })).flatMap(({ pathname, size }) => {
        const number = getPartNumber({ object, pathname })

        return number === null ? [] : [{ number, size }]
      }) satisfies ReconciledSegments
    },
  }
}

const getStagingPrefix = ({ object }: { object: ReservedObject }): string =>
  `${UPLOAD_STAGING_PREFIX}${object.storageFilePath}/`

const getStagedPartPath = ({ number, object }: { number: number; object: ReservedObject }) =>
  `${getStagingPrefix({ object })}${String(number).padStart(PART_NUMBER_DIGITS, '0')}`

const getPartNumber = ({
  object,
  pathname,
}: {
  object: ReservedObject
  pathname: string
}): null | number => {
  const name = pathname.slice(getStagingPrefix({ object }).length)

  return name.length === PART_NUMBER_DIGITS && /^\d+$/.test(name) ? Number(name) : null
}

/** Same resolution as `@vercel/blob`, so browser requests reach the store the SDK uses. */
const getBlobApiUrl = (): string =>
  process.env.VERCEL_BLOB_API_URL ||
  process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL ||
  DEFAULT_BLOB_API_URL

const listStagedParts = async ({
  object,
  token,
}: {
  object: ReservedObject
  token: string
}): Promise<{ pathname: string; size: number; url: string }[]> => {
  const blobs: { pathname: string; size: number; url: string }[] = []
  let cursor: string | undefined

  do {
    const page = await list({ cursor, prefix: getStagingPrefix({ object }), token })

    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return blobs
}

const readStagedPart = async ({
  baseUrl,
  number,
  object,
  size,
}: {
  baseUrl: string
  number: number
  object: ReservedObject
  size: number
}): Promise<Buffer> => {
  const response = await fetch(buildBlobUrl(baseUrl, getStagedPartPath({ number, object })), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Vercel Blob staged part ${number} is not readable (${response.status}).`)
  }

  const body = Buffer.from(await response.arrayBuffer())

  if (body.byteLength !== size) {
    throw new Error(`Vercel Blob staged part ${number} does not have its listed size.`)
  }

  return body
}

/** The blob's size, or `null` when there is no blob at that pathname. */
const getSize = async ({
  pathname,
  token,
}: {
  pathname: string
  token: string
}): Promise<null | number> => {
  try {
    return (await head(pathname, { token })).size
  } catch (err) {
    if (isBlobError({ err, errorClass: BlobNotFoundError })) {
      return null
    }

    throw err
  }
}

/**
 * Converts store faults a retry cannot fix (a revoked token, a missing or suspended store) into a
 * 4xx `APIError`, so core marks the session failed instead of retrying it until it expires.
 */
const withPermanentErrors = async <T>({
  operation,
}: {
  operation: () => Promise<T>
}): Promise<T> => {
  try {
    return await operation()
  } catch (err) {
    const permanentError = [
      { errorClass: BlobAccessError, status: 403 },
      { errorClass: BlobStoreNotFoundError, status: 404 },
      { errorClass: BlobStoreSuspendedError, status: 403 },
    ].find(({ errorClass }) => isBlobError({ err, errorClass }))

    if (permanentError) {
      throw new APIError(
        `Storage rejected the upload (${permanentError.errorClass.name}).`,
        permanentError.status,
      )
    }

    throw err
  }
}

/**
 * Matches by constructor name too, since a bundled copy of `@vercel/blob` has its own error
 * classes. Its errors do not set `name`.
 */
const isBlobError = ({
  err,
  errorClass,
}: {
  err: unknown
  errorClass: abstract new (...args: never[]) => Error
}): boolean =>
  err instanceof errorClass || (err instanceof Error && err.constructor.name === errorClass.name)

/**
 * Maps items with bounded concurrency. After the first failure no new items start, and running
 * ones finish before the failure is thrown, so nothing keeps uploading once completion has failed.
 */
const mapWithConcurrency = async <T, R>({
  concurrency,
  items,
  mapper,
}: {
  concurrency: number
  items: T[]
  mapper: (item: T) => Promise<R>
}): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  let failure: { err: unknown } | undefined

  const worker = async () => {
    while (!failure && nextIndex < items.length) {
      const index = nextIndex++

      try {
        results[index] = await mapper(items[index]!)
      } catch (err) {
        failure ??= { err }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))

  if (failure) {
    throw failure.err
  }

  return results
}
