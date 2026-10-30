import type { AddressInfo } from 'node:net'
import type { Config, PayloadRequest, UploadConfig } from 'payload'

import { createServer } from 'node:http'
import { getExternalFile } from 'payload/internal'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { cloudStoragePlugin } from './plugin.js'

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
  return getExternalFile({
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
  handleDelete: () => undefined,
  handleUpload: () => undefined,
  name: 'test-adapter',
  staticHandler: () => new Response(),
})

describe('cloudStoragePlugin', () => {
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

  it('should insert the prefix field with alwaysInsertFields when the plugin is enabled', () => {
    const config = cloudStoragePlugin({
      alwaysInsertFields: true,
      collections: {
        media: { adapter },
      },
    } as any)({
      collections: [{ fields: [], slug: 'media', upload: true }],
    } as any)
    const fields = config.collections?.[0]?.fields || []

    expect(fields.some((field) => 'name' in field && field.name === 'prefix')).toBe(true)
  })
})
