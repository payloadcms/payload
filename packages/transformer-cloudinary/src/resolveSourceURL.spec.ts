import { describe, expect, it, vi } from 'vitest'

import { createResolveSourceURL } from './resolveSourceURL.js'

const createReq = ({
  doc,
  serverURL = 'https://site.example.com',
}: {
  doc: unknown
  serverURL?: string
}) =>
  ({
    payload: {
      config: { serverURL },
      findByID: vi.fn(async () => doc),
    },
  }) as never

describe('createResolveSourceURL', () => {
  it('should resolve the main file URL against serverURL', async () => {
    const resolve = createResolveSourceURL()

    await expect(
      resolve({
        collectionSlug: 'media',
        documentID: '1',
        filename: 'photo.png',
        req: createReq({ doc: { filename: 'photo.png', url: '/api/media/file/photo.png' } }),
      }),
    ).resolves.toBe('https://site.example.com/api/media/file/photo.png')
  })

  it('should resolve the matching image size rather than the main file', async () => {
    const resolve = createResolveSourceURL()

    await expect(
      resolve({
        collectionSlug: 'media',
        documentID: '1',
        filename: 'photo-400x300.png',
        req: createReq({
          doc: {
            filename: 'photo.png',
            sizes: {
              square: { filename: 'photo-400x300.png', url: 'https://cdn.example.com/square.png' },
            },
            url: 'https://cdn.example.com/main.png',
          },
        }),
      }),
    ).resolves.toBe('https://cdn.example.com/square.png')
  })

  it('should keep an already-absolute URL as-is', async () => {
    const resolve = createResolveSourceURL()

    await expect(
      resolve({
        collectionSlug: 'media',
        documentID: '1',
        filename: 'photo.png',
        req: createReq({ doc: { filename: 'photo.png', url: 'https://cdn.example.com/p.png' } }),
      }),
    ).resolves.toBe('https://cdn.example.com/p.png')
  })

  it('should explain that a relative URL needs serverURL', async () => {
    const resolve = createResolveSourceURL()

    await expect(
      resolve({
        collectionSlug: 'media',
        documentID: '1',
        filename: 'photo.png',
        req: createReq({
          doc: { filename: 'photo.png', url: '/api/media/file/photo.png' },
          serverURL: '',
        }),
      }),
    ).rejects.toThrow(/`serverURL` is not set/)
  })

  it('should explain when no file matches the requested filename', async () => {
    const resolve = createResolveSourceURL()

    await expect(
      resolve({
        collectionSlug: 'media',
        documentID: '1',
        filename: 'missing.png',
        req: createReq({ doc: { filename: 'photo.png', url: 'https://cdn.example.com/p.png' } }),
      }),
    ).rejects.toThrow(/could not resolve a source URL for "missing.png"/)
  })

  it('should look the document up under the requesting user access', async () => {
    const req = createReq({ doc: { filename: 'photo.png', url: 'https://cdn.example.com/p.png' } })
    const resolve = createResolveSourceURL()

    await resolve({ collectionSlug: 'media', documentID: '1', filename: 'photo.png', req })

    expect(
      (req as never as { payload: { findByID: ReturnType<typeof vi.fn> } }).payload.findByID,
    ).toHaveBeenCalledWith(expect.objectContaining({ overrideAccess: false }))
  })
})
