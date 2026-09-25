import type { ContainerClient } from '@azure/storage-blob'
import type { Readable } from 'node:stream'

type Args = { client: ContainerClient; from: string; to: string }

export const copyAzureFile = async ({ client, from, to }: Args): Promise<void> => {
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

  await destination.uploadStream(download.readableStreamBody as Readable, 4 * 1024 * 1024, 4, {
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
  })

  const copied = await destination.getProperties()

  if (copied.contentLength !== properties.contentLength) {
    throw new Error(`Copied Azure object is not readable at its expected length: ${to}`)
  }
}
