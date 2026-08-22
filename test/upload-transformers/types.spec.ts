import type {
  CanTransformArgs,
  Config,
  GlobalUploadConfig,
  HandleTransformRequestArgs,
  HandleTransformRequestResult,
  PayloadRequest,
  TransformFileArgs,
  TransformFileResult,
  UploadTransformer,
} from 'payload'
import type { generatePayloadFileURL as generatePayloadFileURLFromShared } from 'payload/shared'

import { buildConfig, generatePayloadFileURL } from 'payload'
import { describe, expect, test } from 'tstyche'

describe('upload transformer contracts', () => {
  test('should type UploadTransformer with a unique slug and declared MIME types', () => {
    expect<UploadTransformer>().type.toBeAssignableTo<{
      mimeTypes: string[]
      slug: string
    }>()
  })

  test('should type CanTransformArgs with the operation, collection, and request context', () => {
    expect<CanTransformArgs>().type.toBeAssignableTo<{
      collectionSlug: string
      documentID?: number | string
      mimeType: string
      operation: 'request' | 'upload'
      req: PayloadRequest
    }>()
  })

  test('should type TransformFileArgs/TransformFileResult for the upload pipeline', () => {
    expect<TransformFileArgs>().type.toBeAssignableTo<{
      collectionSlug: string
      file: File
      req: PayloadRequest
    }>()

    expect<{ status: 'continue' }>().type.toBeAssignableTo<TransformFileResult>()
    expect<{ file: File; status: 'continue' }>().type.toBeAssignableTo<TransformFileResult>()
    expect<{ file: File; status: 'complete' }>().type.toBeAssignableTo<TransformFileResult>()
    expect<{ status: 'complete' }>().type.not.toBeAssignableTo<TransformFileResult>()
  })

  test('should type HandleTransformRequestArgs/HandleTransformRequestResult for the request pipeline', () => {
    expect<HandleTransformRequestArgs>().type.toBeAssignableTo<{
      collectionSlug: string
      documentID: number | string
      filename: string
      getSourceFile: () => Promise<Response>
      mimeType: string
      req: PayloadRequest
    }>()

    expect<{ status: 'continue' }>().type.toBeAssignableTo<HandleTransformRequestResult>()
    expect<{
      response: Response
      status: 'continue'
    }>().type.toBeAssignableTo<HandleTransformRequestResult>()
    expect<{
      response: Response
      status: 'complete'
    }>().type.toBeAssignableTo<HandleTransformRequestResult>()
    expect<{ status: 'complete' }>().type.not.toBeAssignableTo<HandleTransformRequestResult>()
  })

  test('should type PayloadRequest["fileTransform"] as an optional literal true, never a boolean', () => {
    expect<PayloadRequest['fileTransform']>().type.toBe<true | undefined>()
  })

  test('should type GlobalUploadConfig as the multipart options bag plus transformers', () => {
    expect<GlobalUploadConfig['transformers']>().type.toBe<undefined | UploadTransformer[]>()
    expect<GlobalUploadConfig['useTempFiles']>().type.toBe<boolean | undefined>()
  })

  test('should type Config["upload"] as GlobalUploadConfig rather than the bare multipart options bag', () => {
    expect<Config['upload']>().type.toBe<GlobalUploadConfig | undefined>()
  })

  test('should accept upload.transformers on buildConfig', () => {
    expect(buildConfig).type.toBeCallableWith({
      collections: [],
      db: {} as Config['db'],
      secret: 'test',
      upload: {
        transformers: [
          {
            slug: 'test-transformer',
            mimeTypes: ['image/*'],
          },
        ],
      },
    })
  })

  test('should export generatePayloadFileURL from payload and payload/shared, returning a string', () => {
    expect(generatePayloadFileURL).type.toBe<typeof generatePayloadFileURLFromShared>()

    expect<ReturnType<typeof generatePayloadFileURL>>().type.toBe<string>()

    expect(generatePayloadFileURL).type.toBeCallableWith({
      collectionSlug: 'media',
      config: {} as Config,
      filename: 'logo.png',
      prefix: 'tenants/acme',
      query: { width: 500 },
      relative: true,
    })
  })
})
