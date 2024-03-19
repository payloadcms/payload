import type { SanitizedCollectionConfig } from 'payload/types'

import { isImage } from 'payload/utilities'

import { useComponentMap } from '../providers/ComponentMap/index.js'
import { useConfig } from '../providers/Config/index.js'

const absoluteURLPattern = /^(?:[a-z]+:)?\/\//i
const base64Pattern = /^data:image\/[a-z]+;base64,/

export const useThumbnail = (
  collectionSlug: string,
  uploadConfig: SanitizedCollectionConfig['upload'],
  doc: Record<string, unknown>,
): false | string => {
  const {
    routes: { api: apiRoute },
    serverURL,
  } = useConfig()
  const { componentMap } = useComponentMap()

  if (!collectionSlug || !uploadConfig || !doc) return null

  const { adminThumbnail } = uploadConfig

  const { filename, mimeType, sizes, url } = doc
  const thumbnailSrcFunction = componentMap?.[`${collectionSlug}.adminThumbnail`]

  if (typeof thumbnailSrcFunction === 'function') {
    const thumbnailURL = thumbnailSrcFunction({ doc })

    if (!thumbnailURL) return false

    if (absoluteURLPattern.test(thumbnailURL) || base64Pattern.test(thumbnailURL)) {
      return thumbnailURL
    }

    return `${serverURL}/${thumbnailURL}`
  }

  if (isImage(mimeType as string)) {
    if (typeof adminThumbnail === 'undefined' && url) {
      return url as string
    }

    if (typeof adminThumbnail === 'string') {
      if (sizes?.[adminThumbnail]?.url) {
        return sizes[adminThumbnail].url
      }

      if (sizes?.[adminThumbnail]?.filename) {
        return `${serverURL}${apiRoute}/${collectionSlug}/file/${sizes[adminThumbnail].filename}`
      }
    }

    if (url) {
      return url as string
    }

    if (typeof filename === 'string') {
      return `${serverURL}${apiRoute}/${collectionSlug}/file/${filename}`
    }
  }

  return false
}
