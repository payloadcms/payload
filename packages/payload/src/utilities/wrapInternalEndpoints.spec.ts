import type { Endpoint } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY } from '../uploads/getFileFromClientUpload.js'
import { wrapInternalEndpoints } from './wrapInternalEndpoints.js'

const createTempFile = async (): Promise<string> => {
  const tempFilePath = path.join(
    os.tmpdir(),
    `wrap-internal-endpoints-spec-${Date.now()}-${Math.random()}`,
  )
  await fs.writeFile(tempFilePath, 'temp-file-contents')
  return tempFilePath
}

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const createReq = (tempFilePath?: string): PayloadRequest =>
  ({
    body: null,
    context: tempFilePath ? { [CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]: tempFilePath } : {},
    headers: new Headers(),
    method: 'POST',
    payload: {
      config: {},
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

const wrapEndpoint = (handler: Endpoint['handler']): Endpoint['handler'] => {
  const [endpoint] = wrapInternalEndpoints([{ handler, method: 'post', path: '/test' } as Endpoint])

  return endpoint!.handler
}

describe('wrapInternalEndpoints', () => {
  const tempFilesToRemove: string[] = []

  afterEach(async () => {
    for (const tempFilePath of tempFilesToRemove) {
      await fs.rm(tempFilePath, { force: true })
    }
    tempFilesToRemove.length = 0
  })

  it('removes a client-upload temp file no operation claimed', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    // An endpoint that runs no collection create or update - an auth endpoint, a global update,
    // or a custom endpoint - never reaches unlinkTempFiles.
    const handler = vi.fn(() => Promise.resolve(Response.json({})))
    const req = createReq(tempFilePath)

    await wrapEndpoint(handler)(req)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(await fileExists(tempFilePath)).toBe(false)
    expect(req.context[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]).toBeUndefined()
  })

  it('removes a client-upload temp file when the handler throws', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const handler = vi.fn(() => Promise.reject(new Error('handler failed')))
    const req = createReq(tempFilePath)

    await expect(wrapEndpoint(handler)(req)).rejects.toThrow('handler failed')

    expect(await fileExists(tempFilePath)).toBe(false)
  })

  it('does not throw when the operation already removed the temp file', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    const handler = vi.fn(async (req: PayloadRequest) => {
      delete req.context[CLIENT_UPLOAD_TEMP_FILE_PATH_CONTEXT_KEY]
      await fs.unlink(tempFilePath)
      return Response.json({})
    })
    const req = createReq(tempFilePath)

    await expect(wrapEndpoint(handler)(req)).resolves.toBeInstanceOf(Response)
  })

  it('leaves requests without a materialized temp file untouched', async () => {
    const handler = vi.fn(() => Promise.resolve(Response.json({})))
    const req = createReq()

    await wrapEndpoint(handler)(req)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(req.payload.logger.error).not.toHaveBeenCalled()
  })

  it('removes the temp file only after the handler has finished with it', async () => {
    const tempFilePath = await createTempFile()
    tempFilesToRemove.push(tempFilePath)

    let existsDuringHandler = false
    const handler = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      existsDuringHandler = await fileExists(tempFilePath)
      return Response.json({})
    })
    const req = createReq(tempFilePath)

    await wrapEndpoint(handler)(req)

    expect(existsDuringHandler).toBe(true)
    expect(await fileExists(tempFilePath)).toBe(false)
  })

  it('returns the handler response when the temp file can no longer be removed', async () => {
    const req = createReq(path.join(os.tmpdir(), `wrap-internal-endpoints-spec-missing-file`))
    const handler = vi.fn(() => Promise.resolve(Response.json({})))

    await expect(wrapEndpoint(handler)(req)).resolves.toBeInstanceOf(Response)

    expect(req.payload.logger.error).toHaveBeenCalledWith({
      err: expect.objectContaining({ code: 'ENOENT' }),
      msg: 'Failed to remove client upload temp file',
    })
  })

  it('throws the handler error rather than a cleanup error', async () => {
    const req = createReq(path.join(os.tmpdir(), `wrap-internal-endpoints-spec-missing-file`))
    const handler = vi.fn(() => Promise.reject(new Error('handler failed')))

    await expect(wrapEndpoint(handler)(req)).rejects.toThrow('handler failed')
  })
})
