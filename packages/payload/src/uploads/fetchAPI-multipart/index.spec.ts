import { describe, expect, it } from 'vitest'

import { processMultipartFormdata } from './index.js'

const buildOversizedRequest = () => {
  const formData = new FormData()
  formData.append('file', new Blob(['this file is definitely over five bytes']), 'big.txt')

  return new Request('http://localhost/api/media', {
    body: formData,
    method: 'POST',
  })
}

describe('processMultipartFormdata', () => {
  it('should reject with a 413 by default when a file exceeds the configured size limit', async () => {
    await expect(
      processMultipartFormdata({
        options: {
          limits: { fileSize: 5 },
        },
        request: buildOversizedRequest(),
      }),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('should truncate the file instead of erroring when abortOnLimit is explicitly false', async () => {
    const { error, files } = await processMultipartFormdata({
      options: {
        abortOnLimit: false,
        limits: { fileSize: 5 },
      },
      request: buildOversizedRequest(),
    })

    expect(error).toBeUndefined()
    expect((files!.file as unknown as { truncated: boolean }).truncated).toBe(true)
    expect(files!.file!.size).toBe(5)
  })
})
