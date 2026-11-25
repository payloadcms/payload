import type { UploadTransformer } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { registerUploadVariants } from 'payload'
import { fileURLToPath } from 'url'

import { hookVariantMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** The MIME type of each file the recording stage saw, in order. */
export const recordedStageFileTypes: string[] = []

/** The MIME type of each file the video-only recording stage saw, in order. */
export const recordedVideoOnlyStageFileTypes: string[] = []

/** The `options` each `poster` hook call got, in order. */
export const recordedPosterOptions: unknown[] = []

/** How many times the `stage-owner` transformer's `canTransform` ran for an upload. */
export const stageOwnerCanTransformCalls = { count: 0 }

export const resetHookVariantRecords = (): void => {
  recordedStageFileTypes.length = 0
  recordedVideoOnlyStageFileTypes.length = 0
  recordedPosterOptions.length = 0
  stageOwnerCanTransformCalls.count = 0
}

const readFixturePng = async () =>
  new File([await fs.readFile(path.resolve(dirname, 'image.png'))], 'frame.png', {
    type: 'image/png',
  })

const isHookVariantMedia = ({ collectionSlug }: { collectionSlug: string }) =>
  collectionSlug === hookVariantMediaSlug

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

/**
 * A second hook owner for videos, with a different variant name. `blurBehaviour: 'ineligible'`
 * on the document makes its `canTransform` return false.
 */
export const blurTransformer: UploadTransformer = {
  slug: 'blur',
  mimeTypes: ['video/*'],
  canTransform: ({ doc }) => doc.blurBehaviour !== 'ineligible',
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

/**
 * Changes nothing in the main file, and makes `preview` for videos with the hook. It runs only
 * when the document sets `hasStageOwner`, and counts each `canTransform` call.
 */
export const stageAndHookOwnerTransformer: UploadTransformer = {
  slug: 'stage-owner',
  mimeTypes: ['video/mp4'],
  canTransform: (args) => {
    if (!isHookVariantMedia(args)) {
      return false
    }

    stageOwnerCanTransformCalls.count += 1

    return args.doc.hasStageOwner === true
  },
  init: (config) =>
    registerUploadVariants({
      collections: { [hookVariantMediaSlug]: { variants: [{ name: 'preview' }] } },
      config,
      transformerSlug: 'stage-owner',
    }),
  transformFile: () => Promise.resolve({ status: 'continue' }),
  transformVariant: async () => ({
    file: await readFixturePng(),
    height: 1600,
    status: 'complete',
    width: 1600,
  }),
}

/** A main-file stage for videos and PNGs that records each file it gets. */
export const recordingStage: UploadTransformer = {
  slug: 'recording-stage',
  mimeTypes: ['video/mp4', 'image/png'],
  canTransform: isHookVariantMedia,
  transformFile: ({ file }) => {
    recordedStageFileTypes.push(file.type)
    return Promise.resolve({ status: 'continue' })
  },
}

/** A main-file stage for videos only that records each file it gets. */
export const recordingVideoOnlyStage: UploadTransformer = {
  slug: 'recording-video-only-stage',
  mimeTypes: ['video/mp4'],
  canTransform: isHookVariantMedia,
  transformFile: ({ file }) => {
    recordedVideoOnlyStageFileTypes.push(file.type)
    return Promise.resolve({ status: 'continue' })
  },
}
