import type { FileSizeImproved } from 'payload'

import type { UploadDataImproved } from '../../../../../../features/upload/server/nodes/UploadNode.js'
import type { SerializedUploadNode } from '../../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const UploadJSXConverter: JSXConverters<SerializedUploadNode> = {
  upload: ({ node }) => {
    // TO-DO (v4): SerializedUploadNode should use UploadData_P4
    const uploadDocument = node as UploadDataImproved
    if (typeof uploadDocument?.value !== 'object') {
      return null
    }

    const value = uploadDocument.value
    const url = value.url

    /**
     * If the upload is not an image, return a link to the upload
     */
    if (!value.mimeType.startsWith('image')) {
      return (
        <a href={url} rel="noopener noreferrer">
          {value.filename}
        </a>
      )
    }

    /**
     * If the upload is a simple image with no different sizes, return a simple img tag
     */
    if (!Object.keys(value.sizes).length) {
      return <img alt={value.filename} height={value.height} src={url} width={value.width} />
    }

    /**
     * If the upload is an image with different sizes, return a picture element
     */
    const pictureJSX: React.ReactNode[] = []

    // Iterate through each size in the data.sizes object
    for (const size in value.sizes) {
      const imageSize = value.sizes[size] as FileSizeImproved

      // Skip if any property of the size object is null
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
      const imageSizeURL = imageSize?.url

      pictureJSX.push(
        <source
          key={size}
          media={`(max-width: ${imageSize.width}px)`}
          srcSet={imageSizeURL}
          type={imageSize.mimeType}
        ></source>,
      )
    }

    // Add the default img tag
    pictureJSX.push(
      <img
        alt={value?.filename}
        height={value?.height}
        key={'image'}
        src={url}
        width={value?.width}
      />,
    )
    return <picture>{pictureJSX}</picture>
  },
}
