import type { UploadTransformer } from 'payload'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerUploadVariants } from 'payload'

import {
  mediaHeaderOnlyVideoSlug,
  mediaVideoAllowListSlug,
} from './collections/MediaHeaderOnlyVideo.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
export const posterPNGPath = path.resolve(dirname, '../../uploads/small.png')

/** The top-level box types the poster hook found, and the `moov` box bytes it read. */
export const posterRecords: { boxTypes: string[]; moov?: Buffer } = { boxTypes: [] }

export const resetPosterRecords = (): void => {
  posterRecords.boxTypes = []
  posterRecords.moov = undefined
}

/**
 * Makes `thumbnail` as a real poster hook would find the frame index: it reads each top-level box
 * header, then streams the `moov` box, which the test video has at the end of the file.
 */
export const rangedPosterTransformer: UploadTransformer = {
  slug: 'ranged-poster',
  mimeTypes: ['video/mp4'],
  init: (config) =>
    registerUploadVariants({
      collections: {
        [mediaHeaderOnlyVideoSlug]: { variants: [{ name: 'thumbnail' }] },
        [mediaVideoAllowListSlug]: { variants: [{ name: 'thumbnail' }] },
      },
      config,
      transformerSlug: 'ranged-poster',
    }),
  transformVariant: async ({ signal, source }) => {
    let position = 0

    while (position < source.sizeInBytes) {
      const header = Buffer.from(
        await source.readFileBytes({ numberOfBytes: 16, signal, startByte: position }),
      )
      const boxType = header.toString('latin1', 4, 8)
      const size32 = header.readUInt32BE(0)
      const boxSize =
        size32 === 1
          ? Number(header.readBigUInt64BE(8))
          : size32 === 0
            ? source.sizeInBytes - position
            : size32

      posterRecords.boxTypes.push(boxType)

      if (boxType === 'moov') {
        const stream = await source.streamFile({
          numberOfBytes: boxSize,
          signal,
          startByte: position,
        })
        posterRecords.moov = Buffer.from(await new Response(stream).arrayBuffer())
      }

      position += boxSize
    }

    return {
      file: new File([await readFile(posterPNGPath)], 'poster.png', { type: 'image/png' }),
      status: 'complete',
    }
  },
}
