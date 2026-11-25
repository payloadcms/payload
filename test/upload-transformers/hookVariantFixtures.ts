import type { UploadTransformer } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { registerUploadVariants } from 'payload'
import { fileURLToPath } from 'url'

import { hookVariantMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** The MIME type of each file the recording stage saw, in order. */
export const recordedStageFileTypes: string[] = []

/** The `options` each `poster` hook call got, in order. */
export const recordedPosterOptions: unknown[] = []

const readFixturePng = async () =>
  new File([await fs.readFile(path.resolve(dirname, 'image.png'))], 'frame.png', {
    type: 'image/png',
  })

/**
 * Makes `thumbnail` for videos. `posterBehaviour` on the document picks the result, so one
 * fixture covers ineligible, complete, skip and throw.
 */
export const posterTransformer: UploadTransformer = {
  slug: 'poster',
  mimeTypes: ['video/mp4'],
  canTransform: ({ doc }) =>
    doc.posterBehaviour === 'ineligible' ? false : { canTransform: true, options: { frame: 1 } },
  init: (config) =>
    registerUploadVariants({
      collections: { [hookVariantMediaSlug]: { variants: [{ name: 'thumbnail' }] } },
      config,
      transformerSlug: 'poster',
    }),
  transformVariant: async ({ doc, options }) => {
    recordedPosterOptions.push(options)

    if (doc.posterBehaviour === 'skip') {
      return { status: 'skip' }
    }

    if (doc.posterBehaviour === 'throw') {
      throw new Error('poster: cannot read this video')
    }

    return { file: await readFixturePng(), height: 1600, status: 'complete', width: 1600 }
  },
}

/** A second hook owner for videos, with a different variant name. It has no `canTransform`. */
export const blurTransformer: UploadTransformer = {
  slug: 'blur',
  mimeTypes: ['video/*'],
  init: (config) =>
    registerUploadVariants({
      collections: { [hookVariantMediaSlug]: { variants: [{ name: 'blurhash' }] } },
      config,
      transformerSlug: 'blur',
    }),
  transformVariant: async () => ({
    file: await readFixturePng(),
    height: 1600,
    status: 'complete',
    width: 1600,
  }),
}

/** A later stage for videos that records each file it gets. */
export const recordingVideoStage: UploadTransformer = {
  slug: 'recording-video-stage',
  mimeTypes: ['video/mp4'],
  canTransform: () => true,
  transformFile: ({ file }) => {
    recordedStageFileTypes.push(file.type)
    return Promise.resolve({ status: 'continue' })
  },
}
