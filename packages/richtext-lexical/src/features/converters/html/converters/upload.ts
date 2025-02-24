import type { FileSizeImproved } from 'payload'

import type { SerializedUploadNode } from '../../../../nodeTypes.js'
import type { UploadDataImproved } from '../../../upload/server/nodes/UploadNode.js'
import type { HTMLConverters } from '../types.js'

export const UploadHTMLConverter: HTMLConverters<SerializedUploadNode> = {
  upload: ({ node, providedStyleTag }) => {
    const uploadDocument = node as UploadDataImproved

    // If there's no valid upload data, return an empty string
    if (typeof uploadDocument?.value !== 'object') {
      return ''
    }

    const value = uploadDocument.value
    const url = value.url

    // 1) If upload is NOT an image, return a link
    if (!value.mimeType.startsWith('image')) {
      return `<a${providedStyleTag} href="${url}" rel="noopener noreferrer">${value.filename}</a$>`
    }

    // 2) If image has no different sizes, return a simple <img />
    if (!Object.keys(value.sizes).length) {
      return `
        <img${providedStyleTag}
          alt="${value.filename}"
          height="${value.height}"
          src="${url}"
          width="${value.width}"
        />
      `
    }

    // 3) If image has different sizes, build a <picture> element with <source> tags
    let pictureHTML = ''

    for (const size in value.sizes) {
      const imageSize = value.sizes[size] as FileSizeImproved

      if (
        !imageSize ||
        !imageSize.width ||
        !imageSize.height ||
        !imageSize.mimeType ||
        !imageSize.filesize ||
        !imageSize.filename ||
        !imageSize.url
      ) {
        continue
      }

      pictureHTML += `
        <source
          media="(max-width: ${imageSize.width}px)"
          srcset="${imageSize.url}"
          type="${imageSize.mimeType}"
        />
      `
    }

    pictureHTML += `
      <img
        alt="${value.filename}"
        height="${value.height}"
        src="${url}"
        width="${value.width}"
      />
    `

    return `<picture${providedStyleTag}>${pictureHTML}</picture$>`
  },
}
