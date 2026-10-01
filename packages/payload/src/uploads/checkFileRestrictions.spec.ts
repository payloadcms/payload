import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { checkFileRestrictions } from './checkFileRestrictions.js'

describe('checkFileRestrictions', () => {
  const createReq = () =>
    ({
      payload: {
        logger: { error: vi.fn(), warn: vi.fn() },
      },
    }) as unknown as PayloadRequest

  it('accepts a valid header-only ISO base media upload', async () => {
    const fullSize = 2 * 1024 * 1024
    const fileTypeBox = Buffer.alloc(24)
    fileTypeBox.writeUInt32BE(fileTypeBox.length)
    fileTypeBox.write('ftyp', 4, 4, 'latin1')
    fileTypeBox.write('avif', 8, 4, 'latin1')
    const mediaDataHeader = Buffer.alloc(8)
    mediaDataHeader.writeUInt32BE(fullSize - fileTypeBox.length)
    mediaDataHeader.write('mdat', 4, 4, 'latin1')
    const fileHeader = Buffer.concat([fileTypeBox, mediaDataHeader])

    await expect(
      checkFileRestrictions({
        collection: {
          slug: 'media',
          upload: { disableLocalStorage: true, staticDir: '/tmp' },
        } as any,
        file: {
          data: fileHeader,
          mimetype: 'image/avif',
          name: 'reference.avif',
          size: fullSize,
        },
        req: createReq(),
      }),
    ).resolves.toEqual({ ext: 'avif', mime: 'image/avif' })
  })

  it.each([
    { allowRestrictedFileTypes: false, policy: 'enabled' },
    { allowRestrictedFileTypes: true, policy: 'disabled' },
  ])(
    'rejects malformed ISO base media box boundaries with type checks $policy',
    async ({ allowRestrictedFileTypes }) => {
      const fileContent = Buffer.concat([
        Buffer.alloc(4),
        Buffer.from('ftypavif'),
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
        ),
      ])

      await expect(
        checkFileRestrictions({
          collection: {
            slug: 'media',
            upload: { allowRestrictedFileTypes, mimeTypes: ['image/avif'], staticDir: '/tmp' },
          } as any,
          file: {
            data: fileContent,
            mimetype: 'image/avif',
            name: 'reference.avif',
            size: fileContent.length,
          },
          req: createReq(),
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [{ message: 'Invalid or corrupted ISO base media file.', path: 'file' }],
        },
      })
    },
  )

  it('applies configured MIME types when restricted file types are allowed', async () => {
    const fileContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
      'base64',
    )

    await expect(
      checkFileRestrictions({
        collection: {
          slug: 'media',
          upload: {
            allowRestrictedFileTypes: true,
            mimeTypes: ['image/jpeg'],
            staticDir: '/tmp',
          },
        } as any,
        file: {
          data: fileContent,
          mimetype: 'image/png',
          name: 'reference.png',
          size: fileContent.length,
        },
        req: createReq(),
      }),
    ).rejects.toMatchObject({
      data: { errors: [{ message: 'Invalid MIME type: image/png.', path: 'file' }] },
    })
  })

  it('applies SVG safety checks when restricted file types are allowed', async () => {
    const fileContent = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>void 0</script></svg>',
    )

    await expect(
      checkFileRestrictions({
        collection: {
          slug: 'media',
          upload: { allowRestrictedFileTypes: true, staticDir: '/tmp' },
        } as any,
        file: {
          data: fileContent,
          mimetype: 'image/svg+xml',
          name: 'reference.svg',
          size: fileContent.length,
        },
        req: createReq(),
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [{ message: 'SVG file contains potentially harmful content.', path: 'file' }],
      },
    })
  })
})
