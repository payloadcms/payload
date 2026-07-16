import type { PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { fileInputSchema, resolveFileInput } from './fileInput.js'

describe('MCP file input', () => {
  it('should reject malformed MIME types', () => {
    const result = fileInputSchema.safeParse({
      data: 'aGVsbG8=',
      mimeType: 'text/plain\r\nx-test: value',
      name: 'hello.txt',
      source: 'base64',
    })

    expect(result.success).toBe(false)
  })

  it('should reject oversized base64 files', async () => {
    const req = createRequest({ maxFileSize: 4 })

    await expect(
      resolveFileInput({
        collectionSlug: 'media',
        input: {
          data: Buffer.from('hello').toString('base64'),
          mimeType: 'text/plain',
          name: 'hello.txt',
          source: 'base64',
        },
        req,
      }),
    ).rejects.toThrow('File exceeds the 4 byte upload limit.')
  })

  it('should reject URLs outside the collection allowlist', async () => {
    const req = createRequest({
      allowList: [{ hostname: 'assets.example.com', protocol: 'https' }],
    })

    await expect(
      resolveFileInput({
        collectionSlug: 'media',
        input: {
          source: 'url',
          url: 'https://example.com/image.png',
        },
        req,
      }),
    ).rejects.toThrow('The provided file URL is not allowed.')
  })
})

function createRequest({
  allowList,
  maxFileSize,
}: {
  allowList?: Array<{ hostname: string; protocol: 'http' | 'https' }>
  maxFileSize?: number
}): PayloadRequest {
  return {
    payload: {
      collections: {
        media: {
          config: {
            upload: allowList ? { pasteURL: { allowList } } : {},
          },
        },
      },
      config: {
        upload: {
          limits: {
            fileSize: maxFileSize,
          },
        },
      },
    },
  } as unknown as PayloadRequest
}
