import type { AddressInfo } from 'node:net'
import type { Config, JsonObject, PayloadRequest, UploadConfig } from 'payload'

import type { Adapter } from './types.js'

import { createServer } from 'node:http'
import { downloadFileToBuffer } from 'payload/internal'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { cloudStoragePlugin } from './plugin.js'
import { createFileOperations } from './utilities/createFileOperations.js'

const collectionSlug = 'media'

describe('cloudStoragePlugin external file fetching', () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Length': '12',
      'Content-Type': 'text/plain',
    })
    res.end('stored file\n')
  })

  let port: number

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('should filter private URLs when Payload file access control is disabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const uploadConfig = buildUploadConfig()

    await expect(
      fetchExternalFile({ uploadConfig, url: `http://127.0.0.1:${port}/file.txt` }),
    ).rejects.toThrow('Blocked unsafe attempt to 127.0.0.1')
  })

  it('should allow private URLs when skipSafeFetch is explicitly true', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const uploadConfig = buildUploadConfig(true)

    const file = await fetchExternalFile({
      uploadConfig,
      url: `http://127.0.0.1:${port}/file.txt`,
    })

    expect(file.data.toString()).toBe('stored file\n')
  })

  it('should allow private URLs that match an explicit skipSafeFetch allowlist', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const uploadConfig = buildUploadConfig([
      {
        hostname: '127.0.0.1',
        port: String(port),
        protocol: 'http',
      },
    ])

    const file = await fetchExternalFile({
      uploadConfig,
      url: `http://127.0.0.1:${port}/file.txt`,
    })

    expect(file.data.toString()).toBe('stored file\n')
  })

  it('should allow localhost URLs outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const uploadConfig = buildUploadConfig()

    const file = await fetchExternalFile({
      uploadConfig,
      url: `http://localhost:${port}/file.txt`,
    })

    expect(file.data.toString()).toBe('stored file\n')
  })
})

function buildUploadConfig(skipSafeFetch?: UploadConfig['skipSafeFetch']): UploadConfig {
  const config = cloudStoragePlugin({
    collections: {
      [collectionSlug]: {
        adapter: () => ({
          copyFile: async () => undefined,
          deleteFile: async () => undefined,
          handleDelete: async () => undefined,
          handleUpload: async () => undefined,
          name: 'test-adapter',
          staticHandler: async () => new Response(null, { status: 404 }),
        }),
        disablePayloadAccessControl: true,
      },
    },
  })({
    collections: [
      {
        fields: [],
        slug: collectionSlug,
        upload: typeof skipSafeFetch === 'undefined' ? true : { skipSafeFetch },
      },
    ],
  } as Config)

  const uploadConfig = config.collections?.[0]?.upload
  if (!uploadConfig || typeof uploadConfig !== 'object') {
    throw new Error('Expected an upload configuration')
  }

  return uploadConfig
}

async function fetchExternalFile({
  uploadConfig,
  url,
}: {
  uploadConfig: UploadConfig
  url: string
}) {
  return downloadFileToBuffer({
    data: {
      filename: 'file.txt',
      url,
    },
    req: {
      headers: new Headers(),
      payload: {
        config: {
          cookiePrefix: 'payload',
        },
      },
    } as PayloadRequest,
    uploadConfig,
  })
}

const adapter = () => ({
  copyFile: async () => undefined,
  deleteFile: async () => undefined,
  handleDelete: () => undefined,
  handleUpload: () => undefined,
  name: 'test-adapter',
  staticHandler: () => new Response(),
})

describe('cloudStoragePlugin', () => {
  it('should reject an adapter without key deletion during configuration', () => {
    const legacyAdapter = (() => ({ ...adapter(), deleteFile: undefined })) as unknown as Adapter

    expect(() =>
      cloudStoragePlugin({
        collections: { media: { adapter: legacyAdapter } },
      })({
        collections: [{ fields: [], slug: 'media', upload: true }],
      } as Config),
    ).toThrow('deleteFile')
  })

  it('should normalize a stored prefix during a server-mediated upload', async () => {
    const config = cloudStoragePlugin({
      collections: {
        media: { adapter },
      },
    } as any)({
      collections: [{ fields: [], slug: 'media', upload: true }],
    } as any)
    const hooks = config.collections?.[0]?.hooks?.beforeChange || []
    const req = {
      context: {},
      file: { mimetype: 'image/png', name: 'photo.png', size: 42 },
    }
    let data = { filename: 'photo.png', prefix: '/tenant/../acme' }

    for (const hook of hooks) {
      const result = await hook({ data, operation: 'create', req } as any)
      data = result || data
    }

    expect(data.prefix).toBe('tenant/acme')
  })
})

describe('managed cloud file URLs', () => {
  it.each([
    { hasCustomURL: true, disablePayloadAccessControl: false },
    { hasCustomURL: true, disablePayloadAccessControl: true },
    { hasCustomURL: false, disablePayloadAccessControl: true },
    { hasCustomURL: false, disablePayloadAccessControl: false },
  ])(
    'should stage final representation URLs with custom=$hasCustomURL and public=$disablePayloadAccessControl',
    async ({ hasCustomURL, disablePayloadAccessControl }) => {
      const generateFileURL = vi.fn(
        async ({ filename, prefix }) => `https://custom.example/${prefix}/${filename}`,
      )
      const generateURL = vi.fn(
        async ({ filename, prefix }) => `https://provider.example/${prefix}/${filename}`,
      )
      const handleUpload = vi.fn(async () => undefined)
      const operations = createFileOperations({
        adapter: { ...adapter(), generateURL, handleUpload },
        collection: { slug: 'media', fields: [], upload: true },
        collectionPrefix: 'assets',
        disablePayloadAccessControl,
        generateFileURL: hasCustomURL ? generateFileURL : undefined,
      })
      const makeRepresentation = ({ filename }: { filename: string }) => ({
        filename,
        mimeType: 'image/png',
        prefix: 'tenant',
        _objectKey: 'revision',
        url: `/api/media/file/${filename}`,
      })
      const data = {
        ...makeRepresentation({ filename: 'default.png' }),
        original: makeRepresentation({ filename: 'original.png' }),
        variants: { small: makeRepresentation({ filename: 'small.png' }) },
      }
      await operations.stage({
        data: data as JsonObject,
        files: ['default.png', 'original.png', 'small.png'].map((filename) => ({
          path: `/tmp/${filename}`,
          buffer: Buffer.from('bytes'),
        })),
        req: {
          context: {},
          payload: {
            collections: { media: { config: { upload: { variants: [{ name: 'small' }] } } } },
          },
        } as unknown as PayloadRequest,
        trackStagedObject: vi.fn(),
      })

      for (const representation of [data, data.original, data.variants.small]) {
        const base = hasCustomURL
          ? 'https://custom.example/assets/tenant/revision'
          : disablePayloadAccessControl
            ? 'https://provider.example/assets/tenant/revision'
            : '/api/media/file'
        expect(representation.url).toBe(`${base}/${representation.filename}`)
        expect(representation.prefix).toBe('assets/tenant')
      }
      expect(handleUpload).toHaveBeenCalledTimes(3)
      expect(handleUpload).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: expect.objectContaining({ url: data.url }) }),
      )
      if (hasCustomURL) {
        expect(generateFileURL).toHaveBeenCalledWith(
          expect.objectContaining({
            filename: 'small.png',
            prefix: 'assets/tenant/revision',
            size: { name: 'small' },
          }),
        )
        expect(generateURL).not.toHaveBeenCalled()
      } else {
        expect(generateFileURL).not.toHaveBeenCalled()
        expect(generateURL).toHaveBeenCalledTimes(disablePayloadAccessControl ? 3 : 0)
      }
    },
  )
})
