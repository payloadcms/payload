import { getBestFitFromSizes, isImage } from 'payload/shared'

import { getVideoThumbnailSrc } from './getVideoThumbnailSrc.js'

type GetDocumentThumbnailArgs = {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}

/** Resolve the configured upload using the same thumbnail policy across document cards. */
export function getDocumentThumbnail({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): string | undefined {
  const upload = getThumbnailSource({ doc, useAsThumbnail })?.upload

  if (!upload) {
    return undefined
  }

  const thumbnailURL = typeof upload.thumbnailURL === 'string' ? upload.thumbnailURL : undefined
  const mimeType = typeof upload.mimeType === 'string' ? upload.mimeType : undefined

  if (mimeType && isImage(mimeType)) {
    return (
      getBestFitFromSizes({
        sizes: upload.variants as Record<string, { url?: string; width?: number }>,
        thumbnailURL,
        url: typeof upload.url === 'string' ? upload.url : '',
        width: typeof upload.width === 'number' ? upload.width : undefined,
      }) || undefined
    )
  }

  return thumbnailURL || undefined
}

/**
 * Resolve the video url to render as a frame when the configured upload is a video
 * without an image preview. Pairs with `getDocumentThumbnail`, which covers every other case.
 */
export function getDocumentVideoThumbnail({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): string | undefined {
  const upload = getThumbnailSource({ doc, useAsThumbnail })?.upload

  if (!upload) {
    return undefined
  }

  return getVideoThumbnailSrc({
    mimeType: typeof upload.mimeType === 'string' ? upload.mimeType : undefined,
    thumbnailURL: typeof upload.thumbnailURL === 'string' ? upload.thumbnailURL : undefined,
    url: typeof upload.url === 'string' ? upload.url : undefined,
  })
}

/**
 * Whether the upload behind a document card may load a video frame, which downloads part of
 * the video. Follows the list table's `displayPreview` order: the field, then the upload collection.
 */
export function isDocumentVideoPreviewAllowed({
  collectionSlug,
  doc,
  getUploadDisplayPreview,
  thumbnailField,
  useAsThumbnail,
}: {
  /** The collection of `doc`. */
  collectionSlug: string
  /** Resolve the `upload.displayPreview` option of a collection. */
  getUploadDisplayPreview: (collectionSlug: string) => boolean | undefined
  /** The upload field that `useAsThumbnail` names. */
  thumbnailField?: { displayPreview?: boolean; relationTo: string | string[] }
} & GetDocumentThumbnailArgs): boolean {
  const source = getThumbnailSource({ doc, useAsThumbnail })

  if (!source) {
    return false
  }

  if (!source.isFieldValue) {
    return getUploadDisplayPreview(collectionSlug) ?? true
  }

  const relationTo =
    source.relationTo ??
    (typeof thumbnailField?.relationTo === 'string' ? thumbnailField.relationTo : undefined)

  return (
    thumbnailField?.displayPreview ??
    (relationTo ? getUploadDisplayPreview(relationTo) : undefined) ??
    true
  )
}

type ThumbnailSource = {
  /** `false` when the document is itself the upload. */
  isFieldValue: boolean
  /** The related collection of a polymorphic field value. */
  relationTo?: string
  upload: Record<string, unknown>
}

/** Unwrap the `useAsThumbnail` field value (single, hasMany, or polymorphic) to its upload doc. */
function getThumbnailSource({
  doc,
  useAsThumbnail,
}: GetDocumentThumbnailArgs): ThumbnailSource | undefined {
  const candidate = getThumbnailCandidate({ doc, useAsThumbnail })

  if (!isRecord(candidate)) {
    return undefined
  }

  if (candidate === doc) {
    return { isFieldValue: false, upload: doc }
  }

  if (!('relationTo' in candidate && 'value' in candidate)) {
    return { isFieldValue: true, upload: candidate }
  }

  if (!isRecord(candidate.value)) {
    return undefined
  }

  return {
    isFieldValue: true,
    relationTo: typeof candidate.relationTo === 'string' ? candidate.relationTo : undefined,
    upload: candidate.value,
  }
}

/** The first `useAsThumbnail` value, or the document itself when the field holds no object. */
function getThumbnailCandidate({ doc, useAsThumbnail }: GetDocumentThumbnailArgs): unknown {
  const value = useAsThumbnail ? doc[useAsThumbnail] : undefined

  if (Array.isArray(value)) {
    return value[0]
  }

  if (isRecord(value)) {
    return value
  }

  return doc
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
