import { describe, expect, it } from 'vitest'

import { processMultipartFormdata } from './index.js'

function createMultipartRequest(chunks: Uint8Array[], boundary: string): Request {
  let index = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index])
        index++
      } else {
        controller.close()
      }
    },
  })

  return new Request('http://localhost/', {
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'transfer-encoding': 'chunked',
    },
    body: stream,
    // @ts-expect-error duplex is required for streaming bodies
    duplex: 'half',
  })
}

describe('processMultipart', () => {
  it('runs parseNested post-processing before resolving', async () => {
    const boundary = '----test-boundary-nested'
    const body = new TextEncoder().encode(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="user[name]"\r\n` +
        `\r\n` +
        `Alice\r\n` +
        `--${boundary}--\r\n`,
    )

    const request = createMultipartRequest([body], boundary)
    const result = await processMultipartFormdata({
      request,
      options: { parseNested: true },
    })

    expect(result.fields?.user).toEqual({ name: 'Alice' })
  })
})
