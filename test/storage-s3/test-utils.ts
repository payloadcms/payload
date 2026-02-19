import type { CollectionSlug, Payload } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { expect } from 'vitest'

export const getAWSClient = () =>
  new AWS.S3({
    endpoint: process.env.S3_ENDPOINT!,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  })

export const getTestBucketName = () => process.env.S3_BUCKET!

export async function createTestBucket() {
  try {
    const makeBucketRes = await getAWSClient().send(
      new AWS.CreateBucketCommand({ Bucket: getTestBucketName() }),
    )

    if (makeBucketRes.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to create bucket. ${makeBucketRes.$metadata.httpStatusCode}`)
    }
  } catch (e) {
    if (e instanceof AWS.BucketAlreadyOwnedByYou) {
      console.log('Bucket already exists')
    }
  }
}

export async function clearTestBucket() {
  const listedObjects = await getAWSClient().send(
    new AWS.ListObjectsV2Command({
      Bucket: getTestBucketName(),
    }),
  )

  if (!listedObjects?.Contents?.length) {
    return
  }

  const deleteParams: AWS.DeleteObjectsCommandInput = {
    Bucket: getTestBucketName(),
    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
  }

  const deleteResult = await getAWSClient().send(new AWS.DeleteObjectsCommand(deleteParams))
  if (deleteResult.Errors?.length) {
    throw new Error(JSON.stringify(deleteResult.Errors))
  }
}

export async function verifyUploads({
  collectionSlug,
  uploadId,
  prefix = '',
  payload,
}: {
  collectionSlug: string
  payload: Payload
  prefix?: string
  uploadId: number | string
}) {
  const uploadData = (await payload.findByID({
    collection: collectionSlug as CollectionSlug,
    id: uploadId,
  })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

  const fileKeys = Object.keys(uploadData.sizes || {}).map((key) => {
    const rawFilename = uploadData?.sizes?.[key]?.filename
    return prefix ? `${prefix}/${rawFilename}` : rawFilename
  })

  fileKeys.push(`${prefix ? `${prefix}/` : ''}${uploadData.filename}`)
  try {
    for (const key of fileKeys) {
      const { $metadata } = await getAWSClient().send(
        new AWS.HeadObjectCommand({ Bucket: getTestBucketName(), Key: key }),
      )

      if ($metadata.httpStatusCode !== 200) {
        console.error('Error verifying uploads', key, $metadata)
        throw new Error(`Error verifying uploads: ${key}, ${$metadata.httpStatusCode}`)
      }

      // Verify each size was properly uploaded
      expect($metadata.httpStatusCode).toBe(200)
    }
  } catch (error: unknown) {
    console.error('Error verifying uploads:', fileKeys, error)
    throw error
  }
}

export const MB = (mb: number) => mb * 1024 * 1024
