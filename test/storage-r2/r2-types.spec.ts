import type { R2StorageOptions } from '@payloadcms/storage-r2'

/// <reference types="@cloudflare/workers-types/2023-07-01" />
import { describe, expect, test } from 'tstyche'

type PayloadR2Bucket = R2StorageOptions['bucket']

describe('R2 type compatibility', () => {
  test('Cloudflare R2Bucket is assignable to our R2Bucket', () => {
    // R2Bucket here is the ambient global from @cloudflare/workers-types
    expect<R2Bucket>().type.toBeAssignableTo<PayloadR2Bucket>()
  })
})
