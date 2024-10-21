import type { FileData, FileSize, TypeWithID } from 'payload'

import type { SerializedUploadNode } from '../../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const UploadJSXConverter: JSXConverters<SerializedUploadNode> = {
  upload: ({ node }) => {
    const uploadDocument: {
      value?: FileData & TypeWithID
    } = node as any

    const url = uploadDocument?.value?.url

    /**
     * If the upload is not an image, return a link to the upload
     */
    if (!uploadDocument?.value?.mimeType?.startsWith('image')) {
      return (
        <a href={url} rel="noopener noreferrer">
          {uploadDocument.value?.filename}
        </a>
      )
    }

    /**
     * If the upload is a simple image with no different sizes, return a simple img tag
     */
    if (!uploadDocument?.value?.sizes || !Object.keys(uploadDocument?.value?.sizes).length) {
      return (
        <img
          alt={uploadDocument?.value?.filename}
          height={uploadDocument?.value?.height}
          src={url}
          width={uploadDocument?.value?.width}
        />
      )
    }

    /**
     * If the upload is an image with different sizes, return a picture element
     */
    const pictureJSX: React.ReactNode[] = []

    // Iterate through each size in the data.sizes object
    for (const size in uploadDocument.value?.sizes) {
      const imageSize: {
        url?: string
      } & FileSize = uploadDocument.value?.sizes[size]

      // Skip if any property of the size object is null
      if (
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
          media="(max-width: ${imageSize.width}px)"
          srcSet={imageSizeURL}
          type={imageSize.mimeType}
        ></source>,
      )
    }

    // Add the default img tag
    pictureJSX.push(
      <img
        alt={uploadDocument.value?.filename}
        height={uploadDocument.value?.height}
        key={'image'}
        src={url}
        width={uploadDocument.value?.width}
      />,
    )
    return <picture>{pictureJSX}</picture>
  },
}
