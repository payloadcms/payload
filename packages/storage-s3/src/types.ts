import type { multipartAction } from './constants.js'

export type MultipartAction = (typeof multipartAction)[keyof typeof multipartAction]

type SharedUploadFields = {
  collectionSlug: string
}

type SharedCreateFields = {
  docPrefix?: string
  filename: string
  filesize: number
  mimeType: string
} & SharedUploadFields

export type MultipartCreateFields = SharedCreateFields

export type MultipartPartDescriptor = {
  ETag: string
  PartNumber: number
}

export type MultipartRequestByAction = {
  [multipartAction.abortMultipart]: {
    action: typeof multipartAction.abortMultipart
    key: string
    uploadId: string
  } & SharedUploadFields
  [multipartAction.completeMultipart]: {
    action: typeof multipartAction.completeMultipart
    key: string
    parts: MultipartPartDescriptor[]
    uploadId: string
  } & SharedUploadFields
  [multipartAction.generateSignedURL]: {
    action?: typeof multipartAction.generateSignedURL
  } & SharedCreateFields
  [multipartAction.initiateMultipart]: {
    action: typeof multipartAction.initiateMultipart
    partSize?: number
  } & SharedCreateFields
  [multipartAction.signMultipartPart]: {
    action: typeof multipartAction.signMultipartPart
    key: string
    partNumber: number
    uploadId: string
  } & SharedUploadFields
}

export type GenerateSignedURLRequest =
  MultipartRequestByAction[typeof multipartAction.generateSignedURL]
export type InitiateMultipartRequest =
  MultipartRequestByAction[typeof multipartAction.initiateMultipart]
export type SignMultipartPartRequest =
  MultipartRequestByAction[typeof multipartAction.signMultipartPart]
export type CompleteMultipartRequest =
  MultipartRequestByAction[typeof multipartAction.completeMultipart]
export type AbortMultipartRequest = MultipartRequestByAction[typeof multipartAction.abortMultipart]

export type SignedURLRequest = MultipartRequestByAction[MultipartAction]

export type MultipartResponseByAction = {
  [multipartAction.abortMultipart]: {
    action: typeof multipartAction.abortMultipart
    key: string
    ok: true
    uploadId: string
  }
  [multipartAction.completeMultipart]: {
    action: typeof multipartAction.completeMultipart
    key: string
    ok: true
    partCount: number
    uploadId: string
  }
  [multipartAction.generateSignedURL]: {
    action: typeof multipartAction.generateSignedURL
    docPrefix: string | undefined
    filename?: string
    url: string
  }
  [multipartAction.initiateMultipart]: {
    action: typeof multipartAction.initiateMultipart
    docPrefix: string | undefined
    filename?: string
    key: string
    ok: true
    partCount: number
    partSize: number
    uploadId: string
  }
  [multipartAction.signMultipartPart]: {
    action: typeof multipartAction.signMultipartPart
    key: string
    ok: true
    partNumber: number
    uploadId: string
    url: string
  }
}

export type GenerateSignedURLResponse =
  MultipartResponseByAction[typeof multipartAction.generateSignedURL]
export type InitiateMultipartResponse =
  MultipartResponseByAction[typeof multipartAction.initiateMultipart]
export type SignMultipartPartResponse =
  MultipartResponseByAction[typeof multipartAction.signMultipartPart]
export type CompleteMultipartResponse =
  MultipartResponseByAction[typeof multipartAction.completeMultipart]
export type AbortMultipartResponse =
  MultipartResponseByAction[typeof multipartAction.abortMultipart]

export type SignedURLResponse = MultipartResponseByAction[MultipartAction]
