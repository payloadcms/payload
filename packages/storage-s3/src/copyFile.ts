import type { S3 } from '@aws-sdk/client-s3'
import type { PayloadRequest } from 'payload'

type CopyS3FileArgs = {
  acl?: 'private' | 'public-read'
  bucket: string
  client: S3
  from: string
  req?: PayloadRequest
  to: string
}

const singleCopyLimit = 5 * 1024 ** 3
const partSize = 256 * 1024 ** 2

export const copyS3File = async ({
  acl,
  bucket,
  client,
  from,
  req,
  to,
}: CopyS3FileArgs): Promise<void> => {
  if (from === to) {
    throw new Error('Storage copy requires different source and destination keys')
  }

  const source = await client.headObject({ Bucket: bucket, Key: from })
  const size = source.ContentLength

  if (size === undefined) {
    throw new Error('Storage source has no known length')
  }
  try {
    await client.headObject({ Bucket: bucket, Key: to })
    throw new Error(`Storage destination already exists: ${to}`)
  } catch (err) {
    if (!isNotFound(err)) {
      throw err
    }
  }

  const copySource = `${encodeURIComponent(bucket)}/${from.split('/').map(encodeURIComponent).join('/')}`

  let hasCopied = false
  let destinationETag: string | undefined
  let destinationVersion: string | undefined

  try {
    if (size <= singleCopyLimit) {
      const copied = await client.copyObject({
        ACL: acl,
        Bucket: bucket,
        CopySource: copySource,
        CopySourceIfMatch: source.ETag,
        IfNoneMatch: '*',
        Key: to,
        MetadataDirective: 'COPY',
        ServerSideEncryption: source.ServerSideEncryption,
        SSEKMSKeyId: source.SSEKMSKeyId,
        TaggingDirective: 'COPY',
      })
      hasCopied = true
      destinationETag = copied.CopyObjectResult?.ETag
      destinationVersion = copied.VersionId
    } else {
      const { TagSet = [] } = await client.getObjectTagging({ Bucket: bucket, Key: from })
      const tagging = new URLSearchParams()

      for (const tag of TagSet) {
        if (tag.Key && tag.Value !== undefined) {
          tagging.set(tag.Key, tag.Value)
        }
      }

      const upload = await client.createMultipartUpload({
        ACL: acl,
        Bucket: bucket,
        CacheControl: source.CacheControl,
        ContentDisposition: source.ContentDisposition,
        ContentEncoding: source.ContentEncoding,
        ContentLanguage: source.ContentLanguage,
        ContentType: source.ContentType,
        Expires: source.Expires,
        Key: to,
        Metadata: source.Metadata,
        ServerSideEncryption: source.ServerSideEncryption,
        SSEKMSKeyId: source.SSEKMSKeyId,
        StorageClass: source.StorageClass,
        Tagging: tagging.size ? tagging.toString() : undefined,
      })

      if (!upload.UploadId) {
        throw new Error('S3 did not return a multipart upload ID')
      }

      try {
        const parts = []

        for (let partNumber = 1, start = 0; start < size; start += partSize, partNumber++) {
          const end = Math.min(start + partSize, size) - 1
          const part = await client.uploadPartCopy({
            Bucket: bucket,
            CopySource: copySource,
            CopySourceIfMatch: source.ETag,
            CopySourceRange: `bytes=${start}-${end}`,
            Key: to,
            PartNumber: partNumber,
            UploadId: upload.UploadId,
          })

          if (!part.CopyPartResult?.ETag) {
            throw new Error(`S3 copy part ${partNumber} did not return an ETag`)
          }

          parts.push({ ETag: part.CopyPartResult.ETag, PartNumber: partNumber })
        }

        const copied = await client.completeMultipartUpload({
          Bucket: bucket,
          IfNoneMatch: '*',
          Key: to,
          MultipartUpload: { Parts: parts },
          UploadId: upload.UploadId,
        })
        hasCopied = true
        destinationETag = copied.ETag
        destinationVersion = copied.VersionId
      } catch (err) {
        try {
          await client.abortMultipartUpload({ Bucket: bucket, Key: to, UploadId: upload.UploadId })
        } catch (cleanupError) {
          req?.payload.logger.error({
            err: cleanupError,
            msg: `Failed to abort S3 multipart copy at ${bucket}/${to} (upload ${upload.UploadId})`,
          })
        }
        throw err
      }
    }

    const destination = await client.headObject({ Bucket: bucket, Key: to })

    if (destination.ContentLength !== size) {
      throw new Error(`Copied storage object is not readable at its expected length: ${to}`)
    }
  } catch (err) {
    if (hasCopied) {
      try {
        if (!destinationETag && (!destinationVersion || destinationVersion === 'null')) {
          throw new Error('S3 copy did not return an ETag or version for safe cleanup')
        }
        await client.deleteObject({
          Bucket: bucket,
          IfMatch: destinationETag,
          Key: to,
          VersionId: destinationVersion,
        })
      } catch (cleanupError) {
        req?.payload.logger.error({
          err: cleanupError,
          msg: `Failed to remove unsuccessful S3 copy at ${bucket}/${to}`,
        })
      }
    }
    throw err
  }
}

const isNotFound = (err: unknown): boolean =>
  err !== null &&
  typeof err === 'object' &&
  (('name' in err && (err.name === 'NotFound' || err.name === 'NoSuchKey')) ||
    ('$metadata' in err &&
      typeof err.$metadata === 'object' &&
      err.$metadata !== null &&
      'httpStatusCode' in err.$metadata &&
      err.$metadata.httpStatusCode === 404))
