import type { PayloadRequest } from '../../types/index.js'

import { sharpTransformer } from '../../../../transformer-sharp/src/sharpTransformer.js'
import sharp from 'sharp'
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSourceFileResponse } from '../../uploads/transformers/getSourceFileResponse.js'
import { wrapInternalEndpoints } from '../../utilities/wrapInternalEndpoints.js'
import { previewFileHandler } from './previewFile.js'

vi.mock('../../uploads/transformers/getSourceFileResponse.js', () => ({
  getSourceFileResponse: vi.fn(),
}))

const document = {
  id: '1',
  _transforms: { crop: { height: 2, width: 2, x: 0, y: 0 } },
  filename: 'saved.png',
  mimeType: 'image/png',
  original: { filename: 'original.png', height: 8, mimeType: 'image/png', width: 12 },
}

function makeRequest({
  id = '1',
  transforms = { crop: { height: 3, width: 5, x: 2, y: 1 } } as unknown,
}: { id?: string; transforms?: unknown } = {}) {
  const read = vi.fn().mockResolvedValue({ docs: [document] })
  const update = vi.fn(() => true)
  const req = {
    data: { _transforms: transforms },
    headers: new Headers(),
    method: 'POST',
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            access: { create: () => true, read: () => true, update },
            upload: {},
          },
        },
      },
      config: { cors: [], upload: { transformers: [sharpTransformer({ dynamic: false })] } },
      db: { defaultIDType: 'text', findOne: vi.fn().mockResolvedValue(document) },
      find: read,
      logger: { error: vi.fn(), warn: vi.fn() },
    },
    routeParams: { collection: 'media', ...(id ? { id } : {}) },
    searchParams: new URLSearchParams(),
    t: (key: string) => key,
    user: { id: 'user' },
  } as unknown as PayloadRequest

  return { read, req, update }
}

async function getDimensions({ response }: { response: Response }) {
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()

  return { height: metadata.height, width: metadata.width }
}

describe('previewFileHandler', () => {
  beforeEach(async () => {
    const image = await sharp({ create: { background: 'red', channels: 3, height: 8, width: 12 } })
      .png()
      .toBuffer()
    vi.mocked(getSourceFileResponse).mockImplementation(
      async () => new Response(image, { headers: { 'Content-Type': 'image/png' } }),
    )
  })

  it('should preview replacement edits from the original without changing saved state', async () => {
    const saved = structuredClone(document)
    const { read, req } = makeRequest()
    const response = await previewFileHandler(req)

    expect(await getDimensions({ response })).toEqual({ height: 3, width: 5 })
    expect(document).toEqual(saved)
    expect(getSourceFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'original.png', document }),
    )
    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: false, user: req.user }),
    )
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(req.fileTransform).toBeUndefined()
  })

  it('should preview clearing saved edits from the original', async () => {
    const { req } = makeRequest({ transforms: null })
    const response = await previewFileHandler(req)

    expect(await getDimensions({ response })).toEqual({ height: 8, width: 12 })
    expect(document._transforms.crop.width).toBe(2)
  })

  it('should preview newly selected bytes without looking up or storing a document', async () => {
    const { read, req } = makeRequest({ id: '' })
    const data = await sharp({ create: { background: 'blue', channels: 3, height: 8, width: 12 } })
      .png()
      .toBuffer()
    req.file = { data, mimetype: 'image/png', name: 'new.png', size: data.length }
    const response = await previewFileHandler(req)

    expect(await getDimensions({ response })).toEqual({ height: 3, width: 5 })
    expect(read).not.toHaveBeenCalled()
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should deny previews before source retrieval when update access is denied', async () => {
    const { req, update } = makeRequest()
    update.mockReturnValue(false)

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 403 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should enforce read and document-specific update access before source retrieval', async () => {
    const { read, req } = makeRequest()
    read.mockResolvedValue({ docs: [] })

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 404 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should enforce static read access even when document reads are allowed', async () => {
    const { req } = makeRequest()
    req.payload.collections.media.config.access.read = ({ isReadingStaticFile }) =>
      !isReadingStaticFile

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 403 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should deny original fallback when only transformed files are readable', async () => {
    const { req } = makeRequest({ transforms: null })
    req.payload.config.upload.transformers = []
    req.payload.collections.media.config.access.read = ({ isReadingStaticFile, req }) =>
      !isReadingStaticFile || req.fileTransform === true

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 403 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  for (const shouldReject of [false, true]) {
    it(`should clean up temporary uploaded bytes after a ${shouldReject ? 'failed' : 'successful'} preview`, async () => {
      const directory = await mkdtemp(path.join(tmpdir(), 'payload-preview-'))
      const filePath = path.join(directory, 'source.png')
      const data = await sharp({
        create: { background: 'blue', channels: 3, width: 12, height: 8 },
      })
        .png()
        .toBuffer()
      await writeFile(filePath, data)
      const { req } = makeRequest({
        id: '',
        ...(shouldReject ? { transforms: { crop: { width: 0, height: 3, x: 0, y: 0 } } } : {}),
      })
      req.payload.config.upload.useTempFiles = true
      req.file = {
        data: Buffer.alloc(0),
        mimetype: 'image/png',
        name: 'new.png',
        size: data.length,
        tempFilePath: filePath,
      }
      try {
        if (shouldReject) {
          await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
        } else {
          const response = await previewFileHandler(req)
          expect(await getDimensions({ response })).toEqual({ height: 3, width: 5 })
        }
        await expect(access(filePath)).rejects.toMatchObject({ code: 'ENOENT' })
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })
  }

  it('should require original static read access when clearing edits with Sharp enabled', async () => {
    const { req } = makeRequest({ transforms: null })
    req.payload.collections.media.config.access.read = ({ isReadingStaticFile, req }) =>
      !isReadingStaticFile || req.fileTransform === true

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 403 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should preview the collection resize that will be applied on save', async () => {
    const { req } = makeRequest()
    req.payload.config.upload.transformers = [
      sharpTransformer({ collections: { media: { resizeOptions: { height: 4, width: 4 } } } }),
    ]
    const response = await previewFileHandler(req)

    expect(await getDimensions({ response })).toEqual({ height: 4, width: 4 })
  })

  it('should preview focal-point changes in the requested image variant', async () => {
    const { req } = makeRequest({ transforms: { focalPoint: { x: 0, y: 50 } } })
    req.data!.variant = 'square'
    req.payload.collections.media.config.upload.variants = [{ name: 'square', height: 3, width: 3 }]
    req.payload.config.upload.transformers = [
      sharpTransformer({
        collections: { media: { variants: [{ name: 'square', height: 3, width: 3 }] } },
      }),
    ]
    const response = await previewFileHandler(req)

    expect(await getDimensions({ response })).toEqual({ height: 3, width: 3 })
    expect(document._transforms).toEqual({ crop: { height: 2, width: 2, x: 0, y: 0 } })
  })

  it('should validate crop bounds before fetching the original', async () => {
    const { req } = makeRequest({ transforms: { crop: { height: 3, width: 50, x: 0, y: 0 } } })

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })
})

describe('preview file security', () => {
  it.each(['', '1'])(
    'should reject forbidden HTML for new and replacement files (id %s)',
    async (id) => {
      const { req } = makeRequest({ id, transforms: null })
      req.payload.collections.media.config.upload.mimeTypes = ['image/png']
      const data = Buffer.from('<!doctype html><script>alert(1)</script>')
      req.file = { data, mimetype: 'text/html', name: 'probe.html', size: data.length }

      await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
    },
  )

  it('should reject HTML even when restricted file types are enabled', async () => {
    const { req } = makeRequest({ id: '', transforms: null })
    req.payload.collections.media.config.upload.allowRestrictedFileTypes = true
    req.payload.config.upload.transformers = []
    const data = Buffer.from('<!doctype html><script>alert(1)</script>')
    req.file = { data, mimetype: 'text/html', name: 'probe.html', size: data.length }

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
  })

  it('should reject HTML disguised as an allowed PNG', async () => {
    const { req } = makeRequest({ id: '', transforms: null })
    req.payload.collections.media.config.upload.mimeTypes = ['image/png']
    req.payload.config.upload.transformers = []
    const data = Buffer.from('<!doctype html><script>alert(1)</script>')
    req.file = { data, mimetype: 'image/png', name: 'probe.png', size: data.length }

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
  })

  it('should reject unsafe SVG before preview processing', async () => {
    const { req } = makeRequest({ id: '', transforms: null })
    req.payload.collections.media.config.upload.mimeTypes = ['image/svg+xml']
    req.payload.config.upload.transformers = []
    const data = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    )
    req.file = { data, mimetype: 'image/svg+xml', name: 'probe.svg', size: data.length }

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
  })

  it('should enforce the configured MIME allowlist for a valid image', async () => {
    const { req } = makeRequest({ id: '', transforms: null })
    req.payload.collections.media.config.upload.mimeTypes = ['image/jpeg']
    const data = await sharp({ create: { background: 'red', channels: 3, width: 2, height: 2 } })
      .png()
      .toBuffer()
    req.file = { data, mimetype: 'image/png', name: 'probe.png', size: data.length }

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
  })

  it('should use detected image MIME and protect previews from active content', async () => {
    const { req } = makeRequest({ id: '', transforms: null })
    req.payload.collections.media.config.upload.mimeTypes = ['image/png']
    req.payload.config.upload.transformers = []
    const data = await sharp({ create: { background: 'red', channels: 3, width: 2, height: 2 } })
      .png()
      .toBuffer()
    req.file = { data, mimetype: 'text/html', name: 'probe.png', size: data.length }
    const response = await previewFileHandler(req)

    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'none'")
    expect(await getDimensions({ response })).toEqual({ width: 2, height: 2 })
  })

  it('should reject a non-image preview response from a stored source', async () => {
    const { read, req } = makeRequest({ transforms: null })
    req.payload.config.upload.transformers = []
    read.mockResolvedValue({
      docs: [
        {
          ...document,
          mimeType: 'text/html',
          original: { ...document.original, mimeType: 'text/html' },
        },
      ],
    })
    vi.mocked(getSourceFileResponse).mockResolvedValue(
      new Response('<script>alert(1)</script>', { headers: { 'Content-Type': 'text/html' } }),
    )

    await expect(previewFileHandler(req)).rejects.toMatchObject({ status: 400 })
  })
})

it('should enforce preview restrictions after parsing a multipart request', async () => {
  const { req } = makeRequest({ id: '', transforms: null })
  req.payload.collections.media.config.upload.mimeTypes = ['image/png']
  const formData = new FormData()
  formData.append('_payload', JSON.stringify({ _transforms: null }))
  formData.append(
    'file',
    new File(['<!doctype html><script>alert(1)</script>'], 'probe.html', { type: 'text/html' }),
  )
  const request = Object.assign(
    new Request('http://localhost/api/media/preview-file', { method: 'POST', body: formData }),
    {
      payload: req.payload,
      routeParams: req.routeParams,
      t: req.t,
      user: req.user,
    },
  ) as PayloadRequest
  const [endpoint] = wrapInternalEndpoints([
    { handler: previewFileHandler, method: 'post', path: '/preview-file' },
  ])

  await expect(endpoint.handler(request)).rejects.toMatchObject({ status: 400 })
})

it('should allow a safe SVG preview with restrictive response headers', async () => {
  const { req } = makeRequest({ id: '', transforms: null })
  req.payload.collections.media.config.upload.mimeTypes = ['image/svg+xml']
  req.payload.config.upload.transformers = []
  const data = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>',
  )
  req.file = { data, mimetype: 'image/svg+xml', name: 'safe.svg', size: data.length }
  const response = await previewFileHandler(req)

  expect(response.headers.get('Content-Type')).toBe('image/svg+xml')
  expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'none'")
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(await response.text()).toBe(data.toString())
})
