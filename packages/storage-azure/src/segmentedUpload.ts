import type {
  BlockBlobClient,
  ContainerClient,
  CopyStatusType,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'
import type {
  ReconciledSegments,
  ReservedObject,
  SegmentedUploadCapability,
  UploadInstructionsAccess,
} from 'payload'

import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError } from 'payload'
import {
  assertUploadInstructionsAccess,
  getUploadStagingPath,
  toReservedObject,
} from 'payload/internal'

const MiB = 1024 * 1024
const TiB = 1024 * 1024 * MiB

/** Block IDs must have the same length within a blob, so segment numbers are zero-padded. */
const BLOCK_ID_DIGITS = 6

type Args = {
  access?: UploadInstructionsAccess
  collectionPrefix: string
  containerName: string
  getStorageClient: () => ContainerClient
  useCompositePrefixes?: boolean
}

type AzureProviderState = { contentType: string }

const SOURCE_SAS_LIFETIME_MS = 60 * 60 * 1000

/**
 * Azure block blob uploads for durable upload sessions. The browser stages blocks on a staging
 * blob under `UPLOAD_STAGING_PREFIX` with a short-lived SAS per block. Staging blocks needs a
 * Write SAS, which also allows replacing the blob it names, so it never names the final path.
 * The server reads progress with Get Block List, commits the staging blob, then copies it to the
 * final path with a create-only condition.
 */
export const createSegmentedUpload = ({
  access,
  collectionPrefix,
  containerName,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): SegmentedUploadCapability => {
  const getFinalBlob = ({ object }: { object: ReservedObject }) =>
    getStorageClient().getBlockBlobClient(object.storageFilePath)

  const getStagingBlob = ({ object }: { object: ReservedObject }) =>
    getStorageClient().getBlockBlobClient(getUploadStagingPath({ object }))

  const signBlob = ({
    blobName,
    expiresOn,
    permissions,
  }: {
    blobName: string
    expiresOn: Date
    permissions: string
  }): string =>
    generateBlobSASQueryParameters(
      {
        blobName,
        containerName,
        expiresOn,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn: new Date(Date.now() - 60 * 1000),
      },
      getStorageClient().credential as StorageSharedKeyCredential,
    ).toString()

  return {
    abort: async ({ object }) => {
      const stagingBlob = getStagingBlob({ object })

      // Azure keeps uncommitted blocks for 7 days. Committing an empty list discards them now;
      // it only succeeds when no staging blob was committed, which `deleteIfExists` then removes.
      await ignoreStatus({
        promise: stagingBlob.commitBlockList([], { conditions: { ifNoneMatch: '*' } }),
        statuses: [404, 409],
      })
      await stagingBlob.deleteIfExists()

      // Core only aborts unclaimed sessions, so a committed final blob here is an orphan.
      await getFinalBlob({ object }).deleteIfExists()
    },

    authorize: ({ collectionSlug, req }) =>
      assertUploadInstructionsAccess({ access, collectionSlug, req }),

    complete: async ({ object, providerState, segments }) => {
      const finalBlob = getFinalBlob({ object })
      const stagingBlob = getStagingBlob({ object })

      const existing = await getProperties({ blob: finalBlob })

      // Azure creates the destination as soon as it accepts a copy, so its existence alone does
      // not mean the copy finished. Only a successful copy lets staging go.
      if (existing) {
        if (existing.copyStatus === 'pending') {
          throw new Error('Azure is still copying the uploaded blob.')
        }

        if (existing.copyStatus === 'aborted' || existing.copyStatus === 'failed') {
          // The destination holds nothing usable; remove it so the copy below can run again.
          await finalBlob.deleteIfExists()
        } else {
          // A retry after a lost response: the copy already happened.
          await stagingBlob.deleteIfExists()

          return { size: existing.contentLength ?? -1 }
        }
      }

      const { contentType } = providerState as AzureProviderState
      const blockIDs = [...segments]
        .sort((a, b) => a.number - b.number)
        .map(({ number }) => toBlockID({ number }))

      // 409: an earlier attempt committed the staging blob but did not finish the copy.
      await ignoreStatus({
        promise: stagingBlob.commitBlockList(blockIDs, {
          blobHTTPHeaders: { blobContentType: contentType },
          conditions: { ifNoneMatch: '*' },
        }),
        statuses: [409],
      })

      const sourceSAS = signBlob({
        blobName: stagingBlob.name,
        expiresOn: new Date(Date.now() + SOURCE_SAS_LIFETIME_MS),
        permissions: 'r',
      })

      // Create-only, like every other client upload path: an existing final blob is never replaced.
      // Copies within a storage account keep the block list, which `reconcile` relies on.
      const poller = await finalBlob.beginCopyFromURL(`${stagingBlob.url}?${sourceSAS}`, {
        conditions: { ifNoneMatch: '*' },
      })
      const { copyStatus } = await poller.pollUntilDone()

      if (copyStatus !== 'success') {
        throw new Error(`Azure could not copy the uploaded blob (${copyStatus}).`)
      }

      await stagingBlob.deleteIfExists()

      return { size: (await getProperties({ blob: finalBlob }))?.contentLength ?? -1 }
    },

    getSegmentRequests: ({ expiresIn, object, segments }) => {
      const stagingBlob = getStagingBlob({ object })
      const sasToken = signBlob({
        blobName: stagingBlob.name,
        expiresOn: new Date(Date.now() + expiresIn * 1000),
        permissions: 'w',
      })

      return Promise.resolve(
        segments.map(({ number }) => ({
          method: 'PUT' as const,
          number,
          url: `${stagingBlob.url}?comp=block&blockid=${encodeURIComponent(toBlockID({ number }))}&${sasToken}`,
        })),
      )
    },

    getStoredSize: async ({ object }) => {
      const properties = await getProperties({ blob: getFinalBlob({ object }) })

      // Azure creates the destination as soon as it accepts a copy, so only a finished copy counts.
      if (!properties || (properties.copyStatus && properties.copyStatus !== 'success')) {
        return null
      }

      return properties.contentLength ?? null
    },

    initiate: async ({ collectionSlug, docPrefix, filename, mimeType, req }) => {
      // Azure has no call that starts a block upload, so check the container up front: a missing
      // one would otherwise only surface after the browser started sending blocks.
      const containerExists = await getStorageClient().exists()

      if (!containerExists) {
        throw new APIError('Storage rejected the upload (ContainerNotFound).', 404)
      }

      const object = toReservedObject(
        await resolveSignedURLKey({
          collectionPrefix,
          collectionSlug,
          docPrefix,
          filename,
          req,
          useCompositePrefixes,
        }),
      )

      return { object, providerState: { contentType: mimeType } satisfies AzureProviderState }
    },

    limits: {
      maximumConcurrency: 8,
      maximumObjectSize: 190 * TiB,
      maximumSegmentCount: 50_000,
      maximumSegmentSize: 4000 * MiB,
      minimumSegmentSize: 1,
      segmentSizeGranularity: 1,
    },

    reconcile: async ({ object }) => {
      const staged = await getBlocks({ blob: getStagingBlob({ object }), listType: 'all' })

      // After completion the staging blob is gone and the final blob holds the copied blocks.
      const blocks =
        staged ?? (await getBlocks({ blob: getFinalBlob({ object }), listType: 'committed' }))

      return (blocks ?? []).flatMap(({ name, size }) => {
        const number = fromBlockID({ blockID: name })

        return number === null ? [] : [{ number, size }]
      }) satisfies ReconciledSegments
    },
  }
}

/** The blob's blocks, or `null` when the blob has no blocks at all yet. */
const getBlocks = async ({
  blob,
  listType,
}: {
  blob: BlockBlobClient
  listType: 'all' | 'committed'
}): Promise<{ name: string; size: number }[] | null> => {
  try {
    const { committedBlocks = [], uncommittedBlocks = [] } = await blob.getBlockList(listType)

    return [...committedBlocks, ...uncommittedBlocks]
  } catch (err) {
    if (getStatusCode({ err }) === 404) {
      return null
    }

    throw err
  }
}

const getProperties = async ({
  blob,
}: {
  blob: BlockBlobClient
}): Promise<{ contentLength?: number; copyStatus?: CopyStatusType } | null> => {
  try {
    return await blob.getProperties()
  } catch (err) {
    if (getStatusCode({ err }) === 404) {
      return null
    }

    throw err
  }
}

const toBlockID = ({ number }: { number: number }): string =>
  Buffer.from(String(number).padStart(BLOCK_ID_DIGITS, '0')).toString('base64')

const fromBlockID = ({ blockID }: { blockID: string }): null | number => {
  const decoded = Buffer.from(blockID, 'base64').toString()

  if (decoded.length !== BLOCK_ID_DIGITS || !/^\d+$/.test(decoded)) {
    return null
  }

  return Number(decoded)
}

const getStatusCode = ({ err }: { err: unknown }): number | undefined =>
  typeof err === 'object' && err !== null && 'statusCode' in err
    ? (err.statusCode as number | undefined)
    : undefined

const ignoreStatus = async ({
  promise,
  statuses,
}: {
  promise: Promise<unknown>
  statuses: number[]
}): Promise<void> => {
  try {
    await promise
  } catch (err) {
    const status = getStatusCode({ err })

    if (status === undefined || !statuses.includes(status)) {
      throw err
    }
  }
}
