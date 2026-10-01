import type { PayloadRequest } from '../../../types/index.js'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createOperationRetryRequest } from './createOperationRetryRequest.js'

const temporaryDirectories: string[] = []

const createRequest = ({ tempFilePath }: { tempFilePath?: string } = {}): PayloadRequest => {
  const payload = {
    config: { i18n: { fallbackLanguage: 'en' } },
    db: { defaultIDType: 'text' },
    find: vi.fn(),
  }
  const file = {
    data: Buffer.from('primary file'),
    mimetype: 'text/plain',
    name: 'primary.txt',
    size: 12,
    tempFilePath,
  }

  return {
    context: { nested: { value: 'original' } },
    file,
    files: {
      multiple: [
        {
          data: Buffer.from('array file'),
          mimetype: 'text/plain',
          name: 'array.txt',
          size: 10,
        },
      ],
      single: {
        data: Buffer.from('single file'),
        mimetype: 'text/plain',
        name: 'single.txt',
        size: 11,
      },
    },
    headers: new Headers(),
    i18n: { t: vi.fn() },
    payload,
    payloadAPI: 'local',
    query: { nested: { value: 'original' } },
    routeParams: { nested: { value: 'original' } },
    t: vi.fn(),
    user: null,
  } as unknown as PayloadRequest
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { force: true, recursive: true })),
  )
})

describe('createOperationRetryRequest', () => {
  it('should isolate nested context and every accepted file container', async () => {
    const originalReq = createRequest()
    const firstAttemptReq = await createOperationRetryRequest({ req: originalReq })

    ;(firstAttemptReq.context.nested as { value: string }).value = 'mutated'
    ;(firstAttemptReq.query.nested as { value: string }).value = 'mutated'
    ;(firstAttemptReq.routeParams!.nested as { value: string }).value = 'mutated'
    firstAttemptReq.file!.data[0] = 0
    ;(firstAttemptReq.files!.single as NonNullable<PayloadRequest['file']>).data[0] = 0
    ;(firstAttemptReq.files!.multiple as NonNullable<PayloadRequest['file']>[])[0]!.data[0] = 0

    const secondAttemptReq = await createOperationRetryRequest({ req: originalReq })

    expect(secondAttemptReq.context.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.query.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.routeParams!.nested).toEqual({ value: 'original' })
    expect(secondAttemptReq.file!.data).toEqual(Buffer.from('primary file'))
    expect((secondAttemptReq.files!.single as NonNullable<PayloadRequest['file']>).data).toEqual(
      Buffer.from('single file'),
    )
    expect(
      (secondAttemptReq.files!.multiple as NonNullable<PayloadRequest['file']>[])[0]!.data,
    ).toEqual(Buffer.from('array file'))
    expect(secondAttemptReq.payloadDataLoader).not.toBe(firstAttemptReq.payloadDataLoader)
  })

  it('should give every attempt a separate temp file while preserving the original source', async () => {
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-retry-source-'))
    const sourcePath = path.join(temporaryDirectory, 'source.txt')

    temporaryDirectories.push(temporaryDirectory)
    await fs.writeFile(sourcePath, 'temp file contents')

    const originalReq = createRequest({ tempFilePath: sourcePath })
    const firstAttemptReq = await createOperationRetryRequest({
      copyFileTempPath: true,
      req: originalReq,
    })

    expect(firstAttemptReq.file!.tempFilePath).not.toBe(sourcePath)
    expect(await fs.readFile(firstAttemptReq.file!.tempFilePath!, 'utf8')).toBe(
      'temp file contents',
    )

    await fs.rm(firstAttemptReq.file!.tempFilePath!)

    const secondAttemptReq = await createOperationRetryRequest({
      copyFileTempPath: true,
      req: originalReq,
    })

    expect(secondAttemptReq.file!.tempFilePath).not.toBe(sourcePath)
    expect(secondAttemptReq.file!.tempFilePath).not.toBe(firstAttemptReq.file!.tempFilePath)
    expect(await fs.readFile(secondAttemptReq.file!.tempFilePath!, 'utf8')).toBe(
      'temp file contents',
    )
    expect(await fs.readFile(sourcePath, 'utf8')).toBe('temp file contents')
  })
})
