import type { SanitizedCollectionConfig } from 'payload/types'

import { isImage } from 'payload/utilities'
import { useConfig } from '../providers/Config'

const absoluteURLPattern = new RegExp('^(?:[a-z]+:)?//', 'i')
const base64Pattern = new RegExp(/^data:image\/[a-z]+;base64,/)

const useThumbnail = (
  uploadConfig: SanitizedCollectionConfig['upload'],
  doc: Record<string, unknown>,
): false | string => {
  const { adminThumbnail, staticURL } = uploadConfig

  const { filename, mimeType, sizes, url } = doc

  const { serverURL } = useConfig()
  let pathURL = `${serverURL}${staticURL || ''}`

  if (absoluteURLPattern.test(staticURL)) {
    pathURL = staticURL
  }

  if (typeof adminThumbnail === 'function') {
    const thumbnailURL = adminThumbnail({ doc })

    if (!thumbnailURL) return false

    if (absoluteURLPattern.test(thumbnailURL) || base64Pattern.test(thumbnailURL)) {
      return thumbnailURL
    }

    return `${pathURL}/${thumbnailURL}`
  }

  if (isImage(mimeType as string)) {
    if (typeof adminThumbnail === 'undefined' && url) {
      return url as string
    }

    if (sizes?.[adminThumbnail]?.url) {
      return sizes[adminThumbnail].url
    }

    if (sizes?.[adminThumbnail]?.filename) {
      return `${pathURL}/${sizes[adminThumbnail].filename}`
    }

    if (url) {
      return url as string
    }

    return `${pathURL}/${filename}`
  }

  return false
}

export default useThumbnail
