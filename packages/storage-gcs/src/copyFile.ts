import type { Storage } from '@google-cloud/storage'
import type { PayloadRequest } from 'payload'

type Args = {
  acl?: 'Private' | 'Public'
  bucket: string
  client: Storage
  from: string
  req?: PayloadRequest
  to: string
}

export const copyGcsFile = async ({ acl, bucket, client, from, req, to }: Args): Promise<void> => {
  if (from === to) {
    throw new Error('Storage copy requires different source and destination keys')
  }

  const storageBucket = client.bucket(bucket)
  const source = storageBucket.file(from)
  const destination = storageBucket.file(to)
  const [sourceMetadata] = await source.getMetadata()
  const [hasDestination] = await destination.exists()

  if (hasDestination) {
    throw new Error(`Storage destination already exists: ${to}`)
  }

  const [, response] = await source.copy(destination, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  const generation = (response as { resource?: { generation?: number | string } }).resource
    ?.generation

  try {
    if (acl) {
      await destination[`make${acl}`]()
    }

    const [destinationMetadata] = await destination.getMetadata()

    if (destinationMetadata.size !== sourceMetadata.size) {
      throw new Error(`Copied GCS object is not readable at its expected length: ${to}`)
    }
  } catch (err) {
    try {
      if (generation === undefined) {
        throw new Error('GCS copy did not return a generation for safe cleanup')
      }
      await storageBucket.file(to, { generation }).delete()
    } catch (cleanupError) {
      req?.payload.logger.error({
        err: cleanupError,
        msg: `Failed to remove unsuccessful GCS copy at ${bucket}/${to}`,
      })
    }
    throw err
  }
}
