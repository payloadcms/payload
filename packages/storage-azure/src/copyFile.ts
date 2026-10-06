import type { ContainerClient } from '@azure/storage-blob'
import type { Readable } from 'node:stream'
import type { PayloadRequest } from 'payload'

type Args = { client: ContainerClient; from: string; req?: PayloadRequest; to: string }

export const copyAzureFile = async ({ client, from, req, to }: Args): Promise<void> => {
  if (from === to) {
    throw new Error('Storage copy requires different source and destination keys')
  }

  const source = client.getBlockBlobClient(from)
  const destination = client.getBlockBlobClient(to)
  const properties = await source.getProperties()
  const { tags } = await source.getTags()
  const download = await source.download()

  if (!download.readableStreamBody) {
    throw new Error(`Azure storage source is not readable: ${from}`)
  }

  const uploaded = await destination.uploadStream(
    download.readableStreamBody as Readable,
    4 * 1024 * 1024,
    4,
    {
      blobHTTPHeaders: {
        blobCacheControl: properties.cacheControl,
        blobContentDisposition: properties.contentDisposition,
        blobContentEncoding: properties.contentEncoding,
        blobContentLanguage: properties.contentLanguage,
        blobContentType: properties.contentType,
      },
      conditions: { ifNoneMatch: '*' },
      metadata: properties.metadata,
      tags,
    },
  )

  try {
    const copied = await destination.getProperties()

    if (copied.contentLength !== properties.contentLength) {
      throw new Error(`Copied Azure object is not readable at its expected length: ${to}`)
    }
  } catch (err) {
    try {
      if (!uploaded.etag) {
        throw new Error('Azure copy did not return an ETag for safe cleanup')
      }
      await destination.deleteIfExists({ conditions: { ifMatch: uploaded.etag } })
    } catch (cleanupError) {
      req?.payload.logger.error({
        err: cleanupError,
        msg: `Failed to remove unsuccessful Azure copy at ${client.containerName}/${to}`,
      })
    }
    throw err
  }
}
