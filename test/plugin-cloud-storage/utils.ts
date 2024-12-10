import * as AWS from '@aws-sdk/client-s3'

const getS3Client = () => {
  return new AWS.S3({
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  })
}

export async function createTestBucket(bucketName?: string) {
  const client = getS3Client()
  const makeBucketRes = await client.send(
    new AWS.CreateBucketCommand({ Bucket: bucketName || process.env.S3_BUCKET }),
  )

  if (makeBucketRes.$metadata.httpStatusCode !== 200) {
    throw new Error(`Failed to create bucket. ${makeBucketRes.$metadata.httpStatusCode}`)
  }
}

export async function clearTestBucket(client: AWS.S3Client, bucketName?: string) {
  const listedObjects = await client.send(
    new AWS.ListObjectsV2Command({
      Bucket: bucketName || process.env.S3_BUCKET,
    }),
  )

  if (!listedObjects?.Contents?.length) return

  const deleteParams = {
    Bucket: bucketName || process.env.S3_BUCKET,
    Delete: { Objects: [] },
  }

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key })
  })

  const deleteResult = await client.send(new AWS.DeleteObjectsCommand(deleteParams))
  if (deleteResult.Errors?.length) {
    throw new Error(JSON.stringify(deleteResult.Errors))
  }
}
