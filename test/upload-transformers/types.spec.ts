import type {
  Config,
  GlobalUploadConfig,
  HandleTransformRequestResult,
  PayloadRequest,
  TransformFileResult,
} from 'payload'
import type { generatePayloadFileURL as generatePayloadFileURLFromShared } from 'payload/shared'

import { generatePayloadFileURL } from 'payload'
import { describe, expect, test } from 'tstyche'

describe('upload transformer contracts', () => {
  test('should require a file when a transformFile result is complete', () => {
    expect<{ status: 'complete' }>().type.not.toBeAssignableTo<TransformFileResult>()
  })

  test('should require a response when a handleTransformRequest result is complete', () => {
    expect<{ status: 'complete' }>().type.not.toBeAssignableTo<HandleTransformRequestResult>()
  })

  test('should type PayloadRequest["fileTransform"] as an optional literal true, never a boolean', () => {
    expect<PayloadRequest['fileTransform']>().type.toBe<true | undefined>()
  })

  test('should type Config["upload"] as GlobalUploadConfig rather than the bare multipart options bag', () => {
    expect<Config['upload']>().type.toBe<GlobalUploadConfig | undefined>()
  })

  test('should export the same generatePayloadFileURL from payload and payload/shared', () => {
    expect(generatePayloadFileURL).type.toBe<typeof generatePayloadFileURLFromShared>()
  })
})
