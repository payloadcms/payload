import type { S3 } from '@aws-sdk/client-s3'
import type { ClientUploadsAccess } from '@payloadcms/plugin-cloud-storage/types'
import type { PayloadHandler } from 'payload'

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { resolveSignedURLKey } from '@payloadcms/plugin-cloud-storage/utilities'
import { APIError, Forbidden } from 'payload'

import type { S3StorageOptions } from './index.js'
import type {
  MultipartCreateFields,
  MultipartRequestByAction,
  MultipartResponseByAction,
  SignedURLRequest,
  SignedURLResponse,
} from './types.js'

import {
  DEFAULT_MULTIPART_PART_SIZE,
  FIVE_GIB_BYTES,
  MAX_MULTIPART_PARTS,
  MAX_SIGNED_URL_EXPIRY,
  MIN_MULTIPART_PART_SIZE,
  multipartAction,
} from './constants.js'

type AbortMultipartRequest = MultipartRequestByAction[typeof multipartAction.abortMultipart]
type CompleteMultipartRequest = MultipartRequestByAction[typeof multipartAction.completeMultipart]
type GenerateSignedURLRequest = MultipartRequestByAction[typeof multipartAction.generateSignedURL]
type InitiateMultipartRequest = MultipartRequestByAction[typeof multipartAction.initiateMultipart]
type SignMultipartPartRequest = MultipartRequestByAction[typeof multipartAction.signMultipartPart]

type AbortMultipartResponse = MultipartResponseByAction[typeof multipartAction.abortMultipart]
type CompleteMultipartResponse = MultipartResponseByAction[typeof multipartAction.completeMultipart]
type GenerateSignedURLResponse = MultipartResponseByAction[typeof multipartAction.generateSignedURL]
type InitiateMultipartResponse = MultipartResponseByAction[typeof multipartAction.initiateMultipart]
type SignMultipartPartResponse = MultipartResponseByAction[typeof multipartAction.signMultipartPart]

const bytesToMB = (bytes: number) => {
  return bytes / 1024 / 1024
}

const isDebugUpload = () =>
  process.env.NODE_ENV !== 'production' || process.env.PAYLOAD_UPLOAD_DEBUG === 'true'

const debugUploadLog = ({
  data,
  msg,
  req,
}: {
  data?: Record<string, unknown>
  msg: string
  req: Parameters<PayloadHandler>[0]
}) => {
  if (isDebugUpload()) {
    req.payload.logger.info({
      ...data,
      msg: `[storage-s3 multipart] ${msg}`,
    })
  }
}

interface Args {
  access?: ClientUploadsAccess
  acl?: 'private' | 'public-read'
  bucket: string
  collections: S3StorageOptions['collections']
  getStorageClient: () => S3
  useCompositePrefixes?: boolean
}

const defaultAccess: Args['access'] = ({ req }) => !!req.user

type UploadKeyContext = {
  fileKey: string
  sanitizedDocPrefix: string | undefined
  sanitizedFilename: string | undefined
}

const ensureValidCollectionSlug = ({
  body,
}: {
  body: { collectionSlug?: unknown } & Partial<SignedURLRequest>
}) => {
  if (typeof body.collectionSlug !== 'string' || body.collectionSlug.length === 0) {
    throw new APIError('A valid collectionSlug is required for upload URL generation.', 400)
  }

  return body.collectionSlug
}

const ensureValidFilesize = ({
  allowZero = false,
  filesize,
  message,
}: {
  allowZero?: boolean
  filesize: unknown
  message: string
}) => {
  const minSize = allowZero ? 0 : 1

  if (!Number.isFinite(filesize) || (filesize as number) < minSize) {
    throw new APIError(message, 400)
  }

  return filesize as number
}

const enforceFilesizeLimit = ({
  action,
  filesize,
  filesizeLimit,
}: {
  action?: string
  filesize: number
  filesizeLimit: number | undefined
}) => {
  if (filesizeLimit && filesize > filesizeLimit) {
    const prefix = action ? `${action}: ` : ''

    throw new APIError(
      `${prefix}Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(filesize).toFixed(2)}MB`,
      400,
    )
  }
}

const resolveUploadKeyContext = async ({
  collectionPrefix,
  collectionSlug,
  docPrefix,
  filename,
  req,
  useCompositePrefixes,
}: {
  collectionPrefix: string
  collectionSlug: string
  docPrefix?: string
  filename: unknown
  req: Parameters<PayloadHandler>[0]
  useCompositePrefixes: boolean
}): Promise<UploadKeyContext> => {
  if (typeof filename !== 'string' || filename.length === 0) {
    throw new APIError('A valid filename is required for upload URL generation.', 400)
  }

  const { fileKey, sanitizedDocPrefix, sanitizedFilename } = await resolveSignedURLKey({
    collectionPrefix,
    collectionSlug,
    docPrefix,
    filename,
    req,
    useCompositePrefixes,
  })

  return {
    fileKey,
    sanitizedDocPrefix,
    sanitizedFilename,
  }
}

const buildSignableHeaders = ({
  filesize,
  filesizeLimit,
}: {
  filesize: number
  filesizeLimit: number | undefined
}) => {
  const signableHeaders = new Set<string>()

  if (filesizeLimit) {
    enforceFilesizeLimit({ action: 'generateSignedURL', filesize, filesizeLimit })
    signableHeaders.add('content-length')
  }

  return signableHeaders
}

const initiateMultipartUpload = async ({
  acl,
  body,
  bucket,
  filesizeLimit,
  getStorageClient,
  keyContext,
  req,
}: {
  acl: 'private' | 'public-read' | undefined
  body: InitiateMultipartRequest
  bucket: string
  filesizeLimit: number | undefined
  getStorageClient: () => S3
  keyContext: UploadKeyContext
  req: Parameters<PayloadHandler>[0]
}): Promise<InitiateMultipartResponse> => {
  const filesize = ensureValidFilesize({
    filesize: body.filesize,
    message: 'A valid filesize is required to initiate multipart upload.',
  })
  enforceFilesizeLimit({ action: 'initiateMultipart', filesize, filesizeLimit })

  const requestedPartSize = Number.isFinite(body.partSize)
    ? Math.trunc(body.partSize as number)
    : DEFAULT_MULTIPART_PART_SIZE
  const partSize = Math.max(MIN_MULTIPART_PART_SIZE, requestedPartSize)
  const partCount = Math.ceil(filesize / partSize)

  if (partCount > MAX_MULTIPART_PARTS) {
    throw new APIError(
      `Multipart upload would exceed S3 limit of ${MAX_MULTIPART_PARTS} parts. Increase part size and retry.`,
      400,
    )
  }

  const result = await getStorageClient().send(
    new CreateMultipartUploadCommand({
      ACL: acl,
      Bucket: bucket,
      ContentType: body.mimeType,
      Key: keyContext.fileKey,
    }),
  )

  if (!result.UploadId) {
    throw new APIError('Failed to create multipart upload session.', 500)
  }

  debugUploadLog({
    data: {
      collectionSlug: body.collectionSlug,
      fileKey: keyContext.fileKey,
      filesize,
      partCount,
      partSize,
      uploadId: result.UploadId,
    },
    msg: 'initiate',
    req,
  })

  return {
    action: multipartAction.initiateMultipart,
    docPrefix: keyContext.sanitizedDocPrefix,
    filename: keyContext.sanitizedFilename,
    key: keyContext.fileKey,
    ok: true,
    partCount,
    partSize,
    uploadId: result.UploadId,
  }
}

const signMultipartPartURL = async ({
  body,
  bucket,
  getStorageClient,
}: {
  body: SignMultipartPartRequest
  bucket: string
  getStorageClient: () => S3
}): Promise<SignMultipartPartResponse> => {
  if (
    !body.key ||
    !body.uploadId ||
    !Number.isInteger(body.partNumber) ||
    body.partNumber < 1 ||
    body.partNumber > MAX_MULTIPART_PARTS
  ) {
    throw new APIError(
      'key, uploadId, and a valid partNumber are required to sign multipart part uploads.',
      400,
    )
  }

  const url = await getSignedUrl(
    getStorageClient(),
    new UploadPartCommand({
      Body: undefined,
      Bucket: bucket,
      Key: body.key,
      PartNumber: body.partNumber,
      UploadId: body.uploadId,
    }),
    {
      expiresIn: MAX_SIGNED_URL_EXPIRY,
    },
  )

  return {
    action: multipartAction.signMultipartPart,
    key: body.key,
    ok: true,
    partNumber: body.partNumber,
    uploadId: body.uploadId,
    url,
  }
}

const normalizeCompletedParts = ({
  parts,
}: {
  parts: CompleteMultipartRequest['parts']
}): CompleteMultipartRequest['parts'] => {
  return parts
    .map((part) => {
      const partNumber = Number(part.PartNumber)

      if (!Number.isInteger(partNumber) || partNumber < 1 || !part.ETag) {
        throw new APIError('Invalid multipart part descriptor received during complete.', 400)
      }

      return {
        ETag: part.ETag,
        PartNumber: partNumber,
      }
    })
    .sort((a, b) => a.PartNumber - b.PartNumber)
}

const completeMultipartUpload = async ({
  body,
  bucket,
  getStorageClient,
  req,
}: {
  body: CompleteMultipartRequest
  bucket: string
  getStorageClient: () => S3
  req: Parameters<PayloadHandler>[0]
}): Promise<CompleteMultipartResponse> => {
  if (!body.key || !body.uploadId || !Array.isArray(body.parts) || body.parts.length === 0) {
    throw new APIError(
      'key, uploadId, and at least one completed part are required to complete multipart upload.',
      400,
    )
  }

  const normalizedParts = normalizeCompletedParts({ parts: body.parts })

  await getStorageClient().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: body.key,
      MultipartUpload: {
        Parts: normalizedParts,
      },
      UploadId: body.uploadId,
    }),
  )

  debugUploadLog({
    data: {
      collectionSlug: body.collectionSlug,
      key: body.key,
      partCount: normalizedParts.length,
      uploadId: body.uploadId,
    },
    msg: 'complete',
    req,
  })

  return {
    action: multipartAction.completeMultipart,
    key: body.key,
    ok: true,
    partCount: normalizedParts.length,
    uploadId: body.uploadId,
  }
}

const abortMultipartUpload = async ({
  body,
  bucket,
  getStorageClient,
  req,
}: {
  body: AbortMultipartRequest
  bucket: string
  getStorageClient: () => S3
  req: Parameters<PayloadHandler>[0]
}): Promise<AbortMultipartResponse> => {
  try {
    await getStorageClient().send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: body.key,
        UploadId: body.uploadId,
      }),
    )
    debugUploadLog({
      data: {
        collectionSlug: body.collectionSlug,
        key: body.key,
        uploadId: body.uploadId,
      },
      msg: 'abort',
      req,
    })
  } catch (err) {
    debugUploadLog({
      data: {
        collectionSlug: body.collectionSlug,
        key: body.key,
        uploadId: body.uploadId,
      },
      msg: 'abort-failed',
      req,
    })
    req.payload.logger.error({
      err,
      key: body.key,
      msg: '[storage-s3 multipart] abort failed',
      uploadId: body.uploadId,
    })
  }

  return {
    action: multipartAction.abortMultipart,
    key: body.key,
    ok: true,
    uploadId: body.uploadId,
  }
}

const generateSinglePartSignedURL = async ({
  acl,
  body,
  bucket,
  filesizeLimit,
  getStorageClient,
  keyContext,
}: {
  acl: 'private' | 'public-read' | undefined
  body: GenerateSignedURLRequest
  bucket: string
  filesizeLimit: number | undefined
  getStorageClient: () => S3
  keyContext: UploadKeyContext
}): Promise<GenerateSignedURLResponse> => {
  const filesize = ensureValidFilesize({
    allowZero: true,
    filesize: body.filesize,
    message: 'A valid filesize is required for signed URL generation.',
  })
  enforceFilesizeLimit({ action: 'generateSignedURL', filesize, filesizeLimit })

  if (filesize > FIVE_GIB_BYTES) {
    throw new APIError('Single-request S3 upload is limited to 5 GiB. Use multipart upload.', 400)
  }

  const signableHeaders = buildSignableHeaders({
    filesize,
    filesizeLimit,
  })

  const url = await getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({
      ACL: acl,
      Bucket: bucket,
      ContentLength: filesizeLimit ? Math.min(filesize, filesizeLimit) : undefined,
      ContentType: body.mimeType,
      Key: keyContext.fileKey,
    }),
    {
      expiresIn: 600,
      signableHeaders,
    },
  )

  return {
    action: multipartAction.generateSignedURL,
    docPrefix: keyContext.sanitizedDocPrefix,
    filename: keyContext.sanitizedFilename,
    url,
  }
}

export const getGenerateSignedURLHandler = ({
  access = defaultAccess,
  acl,
  bucket,
  collections,
  getStorageClient,
  useCompositePrefixes = false,
}: Args): PayloadHandler => {
  return async (req) => {
    if (!req.json) {
      throw new APIError('Content-Type expected to be application/json', 400)
    }

    let filesizeLimit = req.payload.config.upload.limits?.fileSize

    if (filesizeLimit === Infinity) {
      filesizeLimit = undefined
    }

    const body = (await req.json()) as {
      collectionSlug?: unknown
    } & {
      partSize?: number
    } & Partial<MultipartCreateFields> &
      Partial<SignedURLRequest>
    const action = body.action || multipartAction.generateSignedURL
    const collectionSlug = ensureValidCollectionSlug({ body })

    const collectionS3Config = collections[collectionSlug]
    if (!collectionS3Config) {
      throw new APIError(`Collection ${collectionSlug} was not found in S3 options`)
    }

    const collectionPrefix =
      (typeof collectionS3Config === 'object' && collectionS3Config.prefix) || ''

    if (!(await access({ collectionSlug, req }))) {
      throw new Forbidden()
    }

    if (action === multipartAction.signMultipartPart) {
      return Response.json(
        await signMultipartPartURL({
          body: body as SignMultipartPartRequest,
          bucket,
          getStorageClient,
        }),
      )
    }

    if (action === multipartAction.completeMultipart) {
      return Response.json(
        await completeMultipartUpload({
          body: body as CompleteMultipartRequest,
          bucket,
          getStorageClient,
          req,
        }),
      )
    }

    if (action === multipartAction.abortMultipart) {
      return Response.json(
        await abortMultipartUpload({
          body: body as AbortMultipartRequest,
          bucket,
          getStorageClient,
          req,
        }),
      )
    }

    const keyContext = await resolveUploadKeyContext({
      collectionPrefix,
      collectionSlug,
      docPrefix: body.docPrefix,
      filename: body.filename,
      req,
      useCompositePrefixes,
    })

    if (action === multipartAction.initiateMultipart) {
      return Response.json(
        await initiateMultipartUpload({
          acl,
          body: {
            action,
            collectionSlug,
            docPrefix: body.docPrefix,
            filename: body.filename as string,
            filesize: body.filesize as number,
            mimeType: body.mimeType as string,
            partSize: body.partSize,
          },
          bucket,
          filesizeLimit,
          getStorageClient,
          keyContext,
          req,
        }),
      )
    }

    const response: SignedURLResponse = await generateSinglePartSignedURL({
      acl,
      body: {
        action: multipartAction.generateSignedURL,
        collectionSlug,
        docPrefix: body.docPrefix,
        filename: body.filename as string,
        filesize: body.filesize as number,
        mimeType: body.mimeType as string,
      },
      bucket,
      filesizeLimit,
      getStorageClient,
      keyContext,
    })

    return Response.json(response)
  }
}
