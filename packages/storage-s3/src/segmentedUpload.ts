import type { CompletedPart, S3 } from '@aws-sdk/client-s3'
import type {
  ReconciledSegments,
  ReservedObject,
  SegmentedUploadCapability,
  UploadInstructionsAccess,
} from 'payload'

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

const MiB = 1024 * 1024
const GiB = 1024 * MiB

type Args = {
  access?: UploadInstructionsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  collectionPrefix: string
  getStorageClient: () => S3
  useCompositePrefixes?: boolean
}

type S3ProviderState = { uploadId: string }

/**
 * Native S3 multipart uploads for durable upload sessions. The server reconciles parts with
 * ListParts, so the browser never needs to read ETag response headers.
 */
export const createSegmentedUpload = ({
  access,
  acl,
  bucket,
  collectionPrefix,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): SegmentedUploadCapability => {
  return {
    abort: async ({ object, providerState }) => {
      const client = getStorageClient()
      const { uploadId } = providerState as S3ProviderState

      await ignoreNotFound({
        promise: client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: object.storageFilePath,
            UploadId: uploadId,
          }),
        ),
      })

      // Core only aborts unclaimed sessions, so a committed object here is an orphan.
      await ignoreNotFound({
        promise: client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: object.storageFilePath }),
        ),
      })
    },

    authorize: async ({ collectionSlug, req }) => {
      if (access ? !(await access({ collectionSlug, req })) : !req.user) {
        throw new Forbidden(req.t)
      }
    },

    complete: async ({ object, providerState }) => {
      const client = getStorageClient()
      const { uploadId } = providerState as S3ProviderState

      try {
        const parts = await listParts({ bucket, client, object, uploadId })

        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucket,
            Key: object.storageFilePath,
            MultipartUpload: {
              Parts: parts.map(({ ETag, PartNumber }) => ({ ETag, PartNumber })),
            },
            UploadId: uploadId,
          }),
        )
      } catch (err) {
        // A retry after a lost response: the multipart upload is gone but the object exists.
        if (!isNotFound({ err })) {
          throw err
        }
      }

      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: object.storageFilePath }),
      )

      return { size: head.ContentLength ?? -1 }
    },

    getSegmentRequests: async ({ expiresIn, object, providerState, segments }) => {
      const client = getStorageClient()
      const { uploadId } = providerState as S3ProviderState

      return Promise.all(
        segments.map(async (segment) => ({
          method: 'PUT' as const,
          number: segment.number,
          url: await getSignedUrl(
            client,
            new UploadPartCommand({
              Bucket: bucket,
              ContentLength: segment.end - segment.start,
              Key: object.storageFilePath,
              PartNumber: segment.number,
              UploadId: uploadId,
            }),
            { expiresIn, signableHeaders: new Set(['content-length']) },
          ),
        })),
      )
    },

    initiate: async ({ collectionSlug, docPrefix, filename, mimeType, req }) => {
      const { sanitizedFilename, storageFilePath, uploadReference } = await resolveSignedURLKey({
        collectionPrefix,
        collectionSlug,
        docPrefix,
        filename,
        req,
        useCompositePrefixes,
      })

      const { UploadId } = await withPermanentErrors({
        operation: () =>
          getStorageClient().send(
            new CreateMultipartUploadCommand({
              ACL: acl,
              Bucket: bucket,
              ContentType: mimeType,
              Key: storageFilePath,
            }),
          ),
      })

      if (!UploadId || !uploadReference._objectKey) {
        throw new Error('S3 multipart upload could not be initiated.')
      }

      return {
        object: {
          _objectKey: uploadReference._objectKey,
          filename: sanitizedFilename,
          prefix: uploadReference.prefix,
          storageFilePath,
        },
        providerState: { uploadId: UploadId } satisfies S3ProviderState,
      }
    },

    limits: {
      maximumConcurrency: 8,
      maximumObjectSize: 5 * 1024 * GiB,
      maximumSegmentCount: 10_000,
      maximumSegmentSize: 5 * GiB,
      minimumSegmentSize: 5 * MiB,
      segmentSizeGranularity: 1,
    },

    reconcile: async ({ object, providerState }) => {
      const { uploadId } = providerState as S3ProviderState
      const parts = await listParts({ bucket, client: getStorageClient(), object, uploadId })

      return parts.map(({ PartNumber, Size }) => ({
        number: PartNumber!,
        size: Size!,
      })) satisfies ReconciledSegments
    },
  }
}

const listParts = async ({
  bucket,
  client,
  object,
  uploadId,
}: {
  bucket: string
  client: S3
  object: ReservedObject
  uploadId: string
}): Promise<({ Size?: number } & CompletedPart)[]> => {
  const parts: ({ Size?: number } & CompletedPart)[] = []
  let partNumberMarker: string | undefined

  do {
    const page = await client.send(
      new ListPartsCommand({
        Bucket: bucket,
        Key: object.storageFilePath,
        PartNumberMarker: partNumberMarker,
        UploadId: uploadId,
      }),
    )

    parts.push(...(page.Parts ?? []))
    partNumberMarker = page.IsTruncated ? page.NextPartNumberMarker : undefined
  } while (partNumberMarker)

  return parts
}

/**
 * Converts S3 client faults (a missing bucket, denied access, an invalid request) into a 4xx
 * `APIError`, so core marks the session failed instead of retrying it until it expires.
 * Timeouts and throttling stay retryable.
 */
const withPermanentErrors = async <T>({
  operation,
}: {
  operation: () => Promise<T>
}): Promise<T> => {
  try {
    return await operation()
  } catch (err) {
    const status = getClientFaultStatus(err)

    if (status) {
      throw new APIError(`Storage rejected the upload (${(err as Error).name}).`, status)
    }

    throw err
  }
}

const getClientFaultStatus = (err: unknown): null | number => {
  if (typeof err !== 'object' || err === null || !('$fault' in err) || err.$fault !== 'client') {
    return null
  }

  const status =
    '$metadata' in err && typeof err.$metadata === 'object' && err.$metadata !== null
      ? (err.$metadata as { httpStatusCode?: number }).httpStatusCode
      : undefined

  if (status === 408 || status === 429) {
    return null
  }

  return status && status >= 400 && status < 500 ? status : 400
}

const isNotFound = ({ err }: { err: unknown }): boolean =>
  typeof err === 'object' &&
  err !== null &&
  'name' in err &&
  (err.name === 'NoSuchUpload' || err.name === 'NoSuchKey' || err.name === 'NotFound')

const ignoreNotFound = async ({ promise }: { promise: Promise<unknown> }): Promise<void> => {
  try {
    await promise
  } catch (err) {
    if (!isNotFound({ err })) {
      throw err
    }
  }
}
