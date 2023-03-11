import fs from 'fs'
import type { TypeWithID } from 'payload/dist/collections/config/types'
import { Upload } from '@aws-sdk/lib-storage'
import type { FileData } from 'payload/dist/uploads/types'
import type stream from 'stream'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload/types'
import { getIncomingFiles } from '../utilities/getIncomingFiles'
import { getStorageClient } from '../utilities/getStorageClient'
import { createKey } from '../utilities/createKey'

interface Args {
  collection: CollectionConfig
}

const multipartThreshold = 1024 * 1024 * 50 // 50MB

export const getBeforeChangeHook =
  ({ collection }: Args): CollectionBeforeChangeHook<FileData & TypeWithID> =>
  async ({ req, data }) => {
    try {
      const files = getIncomingFiles({ req, data })
      const { storageClient, identityID } = await getStorageClient()

      const promises = files.map(async file => {
        const fileKey = file.filename

        const fileBufferOrStream: Buffer | stream.Readable = file.tempFilePath
          ? fs.createReadStream(file.tempFilePath)
          : file.buffer

        if (file.buffer.length > 0 && file.buffer.length < multipartThreshold) {
          await storageClient.putObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: createKey({ collection: collection.slug, filename: fileKey, identityID }),
            Body: fileBufferOrStream,
            ContentType: file.mimeType,
          })
        }

        const parallelUploadS3 = new Upload({
          client: storageClient,
          params: {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: createKey({ collection: collection.slug, filename: fileKey, identityID }),
            Body: fileBufferOrStream,
            ContentType: file.mimeType,
          },
          queueSize: 4,
          partSize: multipartThreshold,
        })

        await parallelUploadS3.done()
      })

      await Promise.all(promises)
    } catch (err: unknown) {
      req.payload.logger.error(
        `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
      )
      req.payload.logger.error(err)
    }
    return data
  }
