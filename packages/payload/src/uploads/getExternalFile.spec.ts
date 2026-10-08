import type { AddressInfo } from 'net'

import { createServer, type Server } from 'http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { gzipSync } from 'zlib'

import type { PayloadRequest } from '../types/index.js'
import type { UploadConfig } from './types.js'

import { getExternalFile } from './getExternalFile.js'

const fileContents = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg">${'<g/>'.repeat(500)}</svg>`)

const req = {
  headers: new Headers(),
  payload: { config: { cookiePrefix: 'payload' } },
} as unknown as PayloadRequest

const uploadConfig = { skipSafeFetch: true } as UploadConfig

describe('getExternalFile', () => {
  let server: Server
  let baseURL: string

  beforeAll(async () => {
    server = createServer((request, response) => {
      response.setHeader('Content-Type', 'image/svg+xml')

      if (request.url === '/with-length.svg') {
        response.setHeader('Content-Length', String(fileContents.byteLength))
        response.end(fileContents)
        return
      }

      if (request.url === '/no-length.svg') {
        // Writing without a Content-Length makes Node use chunked transfer encoding
        response.write(fileContents.subarray(0, 100))
        response.end(fileContents.subarray(100))
        return
      }

      if (request.url === '/compressed.svg') {
        const compressed = gzipSync(fileContents)

        response.setHeader('Content-Encoding', 'gzip')
        response.setHeader('Content-Length', String(compressed.byteLength))
        response.end(compressed)
        return
      }

      response.statusCode = 404
      response.end()
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('should report the size of the file when Content-Length is sent', async () => {
    const file = await getExternalFile({
      data: { filename: 'with-length.svg', url: `${baseURL}/with-length.svg` },
      req,
      uploadConfig,
    })

    expect(file.size).toBe(fileContents.byteLength)
    expect(file.data.byteLength).toBe(fileContents.byteLength)
  })

  it('should report the size of the file when no Content-Length is sent', async () => {
    const file = await getExternalFile({
      data: { filename: 'no-length.svg', url: `${baseURL}/no-length.svg` },
      req,
      uploadConfig,
    })

    expect(file.size).toBe(fileContents.byteLength)
  })

  it('should report the decoded size of the file when the response is compressed', async () => {
    const file = await getExternalFile({
      data: { filename: 'compressed.svg', url: `${baseURL}/compressed.svg` },
      req,
      uploadConfig,
    })

    expect(file.data.byteLength).toBe(fileContents.byteLength)
    expect(file.size).toBe(fileContents.byteLength)
  })
})
