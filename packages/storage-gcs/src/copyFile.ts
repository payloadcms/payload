import type { Storage } from '@google-cloud/storage'

type Args = {
  acl?: 'Private' | 'Public'
  bucket: string
  client: Storage
  from: string
  to: string
}

export const copyGcsFile = async ({ acl, bucket, client, from, to }: Args): Promise<void> => {
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

  await source.copy(destination, { preconditionOpts: { ifGenerationMatch: 0 } })

  if (acl) {
    await destination[`make${acl}`]()
  }

  const [destinationMetadata] = await destination.getMetadata()

  if (destinationMetadata.size !== sourceMetadata.size) {
    throw new Error(`Copied GCS object is not readable at its expected length: ${to}`)
  }
}
