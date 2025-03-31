import type { FileData, FileSizeImproved, TypeWithID } from 'payload'

import type { SerializedUploadNode } from '../../../../../nodeTypes.js'
import type { UploadDataImproved } from '../../../../upload/server/nodes/UploadNode.js'
import type { HTMLConverters } from '../types.js'

export const UploadHTMLConverter: HTMLConverters<SerializedUploadNode> = {
  upload: ({ node, providedStyleTag }) => {
    const uploadNode = node as UploadDataImproved

    let uploadDoc: (FileData & TypeWithID) | undefined = undefined

    // If there's no valid upload data, populate return an empty string
    if (typeof uploadNode.value !== 'object') {
      return ''
    } else {
      uploadDoc = uploadNode.value as unknown as FileData & TypeWithID
    }

    if (!uploadDoc) {
      return ''
    }

    const url = uploadDoc.url

    // 1) If upload is NOT an image, return a link
    if (!uploadDoc.mimeType.startsWith('image')) {
      return `<a${providedStyleTag} href="${url}" rel="noopener noreferrer">${uploadDoc.filename}</a$>`
    }

    // 2) If image has no different sizes, return a simple <img />
    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return `
        <img${providedStyleTag}
          alt="${uploadDoc.filename}"
          height="${uploadDoc.height}"
          src="${url}"
          width="${uploadDoc.width}"
        />
      `
    }

    // 3) If image has different sizes, build a <picture> element with <source> tags
    let pictureHTML = ''

    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size] as FileSizeImproved

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
        alt="${uploadDoc.filename}"
        height="${uploadDoc.height}"
        src="${url}"
        width="${uploadDoc.width}"
      />
    `

    return `<picture${providedStyleTag}>${pictureHTML}</picture$>`
  },
}
