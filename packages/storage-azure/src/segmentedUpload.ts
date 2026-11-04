import type {
  BlockBlobClient,
  ContainerClient,
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
import { APIError, Forbidden } from 'payload'

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

/**
 * Blocks are staged on a separate blob under this prefix and copied to the final path at
 * completion. Staging blocks needs a Write SAS, which also allows replacing the blob it names;
 * keeping that blob apart means an unexpired block URL can never replace the stored file.
 */
export const UPLOAD_STAGING_PREFIX = 'payload-upload-sessions/'

const SOURCE_SAS_LIFETIME_MS = 60 * 60 * 1000

/**
 * Azure block blob uploads for durable upload sessions. The browser stages blocks on a staging
 * blob with a short-lived SAS per block. The server reads progress with Get Block List, commits
 * the staging blob, then copies it to the final path with a create-only condition.
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
    getStorageClient().getBlockBlobClient(getStagingPath({ object }))

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

    authorize: async ({ collectionSlug, req }) => {
      if (access ? !(await access({ collectionSlug, req })) : !req.user) {
        throw new Forbidden(req.t)
      }
    },

    complete: async ({ object, providerState, segments }) => {
      const finalBlob = getFinalBlob({ object })
      const stagingBlob = getStagingBlob({ object })

      // A retry after a lost response: the copy already happened.
      const existing = await getSize({ blob: finalBlob })

      if (existing !== null) {
        await stagingBlob.deleteIfExists()

        return { size: existing }
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

      return { size: (await getSize({ blob: finalBlob })) ?? -1 }
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

    initiate: async ({ collectionSlug, docPrefix, filename, mimeType, req }) => {
      // Azure has no call that starts a block upload, so check the container up front: a missing
      // one would otherwise only surface after the browser started sending blocks.
      const containerExists = await getStorageClient().exists()

      if (!containerExists) {
        throw new APIError('Storage rejected the upload (ContainerNotFound).', 404)
      }

      const { sanitizedFilename, storageFilePath, uploadReference } = await resolveSignedURLKey({
        collectionPrefix,
        collectionSlug,
        docPrefix,
        filename,
        req,
        useCompositePrefixes,
      })

      if (!uploadReference._objectKey) {
        throw new Error('Azure block upload could not be initiated.')
      }

      return {
        object: {
          _objectKey: uploadReference._objectKey,
          filename: sanitizedFilename,
          prefix: uploadReference.prefix,
          storageFilePath,
        },
        providerState: { contentType: mimeType } satisfies AzureProviderState,
      }
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

const getStagingPath = ({ object }: { object: ReservedObject }): string =>
  `${UPLOAD_STAGING_PREFIX}${object.storageFilePath}`

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

const getSize = async ({ blob }: { blob: BlockBlobClient }): Promise<null | number> => {
  try {
    return (await blob.getProperties()).contentLength ?? -1
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
