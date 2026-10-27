import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { UploadTransformer } from './transformers/types.js'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchFullClientUploadMock = vi.fn()

vi.mock('./getFileFromUploadInstructions.js', () => ({
  fetchFullClientUpload: fetchFullClientUploadMock,
}))

const { generateFileData } = await import('./generateFileData.js')

const fullContent = 'full-content'

const collection = {
  config: {
    slug: 'media',
    upload: { disableLocalStorage: true, staticDir: os.tmpdir() },
  },
} as unknown as Collection

/** What `getFileFromUploadInstructions` returns for a 'none' content requirement. */
const createReq = (transformers: UploadTransformer[]): PayloadRequest =>
  ({
    context: {},
    file: {
      data: Buffer.alloc(0),
      mimetype: 'video/mp4',
      name: 'clip.mp4',
      size: fullContent.length,
      uploadReference: { prefix: '' },
    },
    payload: {
      collections: { media: { config: { fields: [], upload: {} } } },
      config: { routes: { api: '/api' }, upload: { transformers } },
      db: { findOne: vi.fn(async () => null) },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

describe('generateFileData - client uploads without full contents', () => {
  let tempFilePath: string

  beforeEach(async () => {
    tempFilePath = path.join(os.tmpdir(), `client-upload-${randomUUID()}`)
    await fs.writeFile(tempFilePath, fullContent)
    fetchFullClientUploadMock.mockImplementation(({ file }) =>
      Promise.resolve({ ...file, data: Buffer.alloc(0), tempFilePath }),
    )
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await fs.rm(tempFilePath, { force: true })
  })

  it('should not download a client upload when every transformer declines it', async () => {
    const transformFile = vi.fn()
    const req = createReq([
      { slug: 'declining', canTransform: () => false, mimeTypes: ['video/*'], transformFile },
    ])

    await generateFileData({
      collection,
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      req,
    })

    expect(fetchFullClientUploadMock).not.toHaveBeenCalled()
    expect(transformFile).not.toHaveBeenCalled()
  })

  it('should download a client upload when a transformer accepts it, and pass it the whole file', async () => {
    let receivedContent: string | undefined
    const req = createReq([
      {
        slug: 'accepting',
        mimeTypes: ['video/*'],
        transformFile: async ({ file }) => {
          receivedContent = await file.text()
          return { status: 'continue' }
        },
      },
    ])

    await generateFileData({
      collection,
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      req,
    })

    expect(fetchFullClientUploadMock).toHaveBeenCalledOnce()
    expect(receivedContent).toBe(fullContent)
    // The temp file is on req.file, so it is removed after the operation.
    expect(req.file?.tempFilePath).toBe(tempFilePath)
  })

  it('should give canTransform the stored fields of an update before it decides to download', async () => {
    const canTransform = vi.fn<NonNullable<UploadTransformer['canTransform']>>(() => false)
    const req = createReq([
      { slug: 'declining', canTransform, mimeTypes: ['video/*'], transformFile: vi.fn() },
    ])

    await generateFileData({
      collection,
      config: {} as SanitizedConfig,
      data: { alt: 'new' },
      operation: 'update',
      originalDoc: { id: 1, alt: 'old', title: 'stored', filename: 'old.mp4' },
      req,
    })

    expect(canTransform).toHaveBeenCalledWith(
      expect.objectContaining({
        doc: expect.objectContaining({ alt: 'new', title: 'stored' }),
        originalDoc: expect.objectContaining({ alt: 'old', title: 'stored' }),
      }),
    )
    expect(fetchFullClientUploadMock).not.toHaveBeenCalled()
  })
})
