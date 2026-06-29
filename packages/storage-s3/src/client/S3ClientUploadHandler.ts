'use client'
import { createClientUploadHandler } from '@payloadcms/plugin-cloud-storage/client'
import { formatAdminURL } from 'payload/shared'

import type {
  MultipartRequestByAction,
  MultipartResponseByAction,
  SignedURLRequest,
} from '../types.js'

import {
  DEFAULT_MULTIPART_PART_SIZE,
  FIVE_GIB_BYTES,
  MAX_PART_RETRIES,
  MULTIPART_CONCURRENCY,
  multipartAction,
  RETRY_BASE_MS,
} from '../constants.js'

type CompleteMultipartRequest = MultipartRequestByAction[typeof multipartAction.completeMultipart]
type GenerateSignedURLRequest = MultipartRequestByAction[typeof multipartAction.generateSignedURL]
type InitiateMultipartRequest = MultipartRequestByAction[typeof multipartAction.initiateMultipart]
type SignMultipartPartRequest = MultipartRequestByAction[typeof multipartAction.signMultipartPart]

type AbortMultipartResponse = MultipartResponseByAction[typeof multipartAction.abortMultipart]
type GenerateSignedURLResponse = MultipartResponseByAction[typeof multipartAction.generateSignedURL]
type InitiateMultipartResponse = MultipartResponseByAction[typeof multipartAction.initiateMultipart]
type SignMultipartPartResponse = MultipartResponseByAction[typeof multipartAction.signMultipartPart]

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const formatResponseErrors = (errors: unknown) => {
  if (!Array.isArray(errors)) {
    return 'Upload request failed.'
  }

  return errors.reduce((acc, err) => {
    const errorMessage =
      err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message
        : 'Unknown error'

    return `${acc ? `${acc}, ` : ''}${errorMessage}`
  }, '')
}

const parseJSONOrThrow = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as { errors?: unknown } & T

  if (!response.ok) {
    throw new Error(formatResponseErrors(data?.errors))
  }

  return data
}

type PostToSigner = <T>(body: SignedURLRequest) => Promise<T>

const createPostToSigner = ({ endpointRoute }: { endpointRoute: string }): PostToSigner => {
  return async <T>(body: SignedURLRequest) => {
    const response = await fetch(endpointRoute, {
      body: JSON.stringify(body),
      credentials: 'include',
      method: 'POST',
    })

    return parseJSONOrThrow<T>(response)
  }
}

const updateFilenameIfNeeded = ({
  sanitizedFilename,
  updateFilename,
  uploadedFilename,
}: {
  sanitizedFilename?: string
  updateFilename: (filename: string) => void
  uploadedFilename: string
}) => {
  if (sanitizedFilename && sanitizedFilename !== uploadedFilename) {
    updateFilename(sanitizedFilename)
  }
}

const uploadSinglePart = async ({
  file,
  postToSigner,
  signerRequest,
  updateFilename,
}: {
  file: File
  postToSigner: PostToSigner
  signerRequest: GenerateSignedURLRequest
  updateFilename: (filename: string) => void
}) => {
  const response = await postToSigner<GenerateSignedURLResponse>(signerRequest)

  updateFilenameIfNeeded({
    sanitizedFilename: response.filename,
    updateFilename,
    uploadedFilename: file.name,
  })

  await fetch(response.url, {
    body: file,
    headers: { 'Content-Length': file.size.toString(), 'Content-Type': file.type },
    method: 'PUT',
  })

  return { prefix: response.docPrefix }
}

const signMultipartPart = async ({
  collectionSlug,
  key,
  partNumber,
  postToSigner,
  uploadId,
}: {
  collectionSlug: string
  key: string
  partNumber: number
  postToSigner: PostToSigner
  uploadId: string
}) => {
  const request: SignMultipartPartRequest = {
    action: multipartAction.signMultipartPart,
    collectionSlug,
    key,
    partNumber,
    uploadId,
  }

  return postToSigner<SignMultipartPartResponse>(request)
}

const uploadPartWithRetry = async ({
  collectionSlug,
  completedParts,
  file,
  key,
  partNumber,
  partSize,
  postToSigner,
  uploadId,
}: {
  collectionSlug: string
  completedParts: { ETag: string; PartNumber: number }[]
  file: File
  key: string
  partNumber: number
  partSize: number
  postToSigner: PostToSigner
  uploadId: string
}) => {
  let attempt = 0

  while (attempt <= MAX_PART_RETRIES) {
    try {
      const start = (partNumber - 1) * partSize
      const end = Math.min(start + partSize, file.size)
      const blob = file.slice(start, end)
      const { url } = await signMultipartPart({
        collectionSlug,
        key,
        partNumber,
        postToSigner,
        uploadId,
      })

      const uploadPartResponse = await fetch(url, {
        body: blob,
        method: 'PUT',
      })

      if (!uploadPartResponse.ok) {
        throw new Error(`Upload part ${partNumber} failed with status ${uploadPartResponse.status}`)
      }

      const etag = uploadPartResponse.headers.get('etag')
      if (!etag) {
        throw new Error(`Upload part ${partNumber} did not return an ETag.`)
      }

      completedParts.push({
        ETag: etag,
        PartNumber: partNumber,
      })

      return
    } catch (error) {
      if (attempt === MAX_PART_RETRIES) {
        throw error
      }

      const backoff = RETRY_BASE_MS * Math.pow(2, attempt)
      await sleep(backoff)
      attempt += 1
    }
  }
}

const completeMultipartUpload = async ({
  collectionSlug,
  key,
  parts,
  postToSigner,
  uploadId,
}: {
  collectionSlug: string
  key: string
  parts: CompleteMultipartRequest['parts']
  postToSigner: PostToSigner
  uploadId: string
}) => {
  const request: CompleteMultipartRequest = {
    action: multipartAction.completeMultipart,
    collectionSlug,
    key,
    parts,
    uploadId,
  }

  await postToSigner(request)
}

const abortMultipartUpload = async ({
  collectionSlug,
  key,
  postToSigner,
  uploadId,
}: {
  collectionSlug: string
  key: string
  postToSigner: PostToSigner
  uploadId: string
}) => {
  await postToSigner<AbortMultipartResponse>({
    action: multipartAction.abortMultipart,
    collectionSlug,
    key,
    uploadId,
  }).catch(() => undefined)
}

const uploadMultipart = async ({
  collectionSlug,
  file,
  postToSigner,
  signerRequest,
  updateFilename,
}: {
  collectionSlug: string
  file: File
  postToSigner: PostToSigner
  signerRequest: InitiateMultipartRequest
  updateFilename: (filename: string) => void
}) => {
  const { docPrefix, filename, key, partCount, partSize, uploadId } =
    await postToSigner<InitiateMultipartResponse>(signerRequest)

  updateFilenameIfNeeded({
    sanitizedFilename: filename,
    updateFilename,
    uploadedFilename: file.name,
  })

  const completedParts: CompleteMultipartRequest['parts'] = []
  let nextPartNumber = 1

  const worker = async () => {
    while (nextPartNumber <= partCount) {
      const partNumber = nextPartNumber
      nextPartNumber += 1
      await uploadPartWithRetry({
        collectionSlug,
        completedParts,
        file,
        key,
        partNumber,
        partSize,
        postToSigner,
        uploadId,
      })
    }
  }

  const workers: Promise<void>[] = []
  for (let index = 0; index < Math.min(MULTIPART_CONCURRENCY, partCount); index++) {
    workers.push(worker())
  }

  try {
    await Promise.all(workers)
    await completeMultipartUpload({
      collectionSlug,
      key,
      parts: completedParts,
      postToSigner,
      uploadId,
    })

    return {
      prefix: docPrefix,
    }
  } catch (error) {
    await abortMultipartUpload({
      collectionSlug,
      key,
      postToSigner,
      uploadId,
    })
    throw error
  }
}

export const S3ClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    file,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    })
    const postToSigner = createPostToSigner({ endpointRoute })
    const baseRequest = {
      collectionSlug,
      docPrefix,
      filename: file.name,
      filesize: file.size,
      mimeType: file.type,
    }

    if (file.size <= FIVE_GIB_BYTES) {
      return uploadSinglePart({
        file,
        postToSigner,
        signerRequest: {
          action: multipartAction.generateSignedURL,
          ...baseRequest,
        },
        updateFilename,
      })
    }

    return uploadMultipart({
      collectionSlug,
      file,
      postToSigner,
      signerRequest: {
        action: multipartAction.initiateMultipart,
        ...baseRequest,
        partSize: DEFAULT_MULTIPART_PART_SIZE,
      },
      updateFilename,
    })
  },
})
