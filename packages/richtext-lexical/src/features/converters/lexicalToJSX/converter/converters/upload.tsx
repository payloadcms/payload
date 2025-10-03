import type { FileData, FileSizeImproved, TypeWithID } from 'payload'

import type { SerializedUploadNode } from '../../../../../nodeTypes.js'
import type { UploadDataImproved } from '../../../../upload/server/nodes/UploadNode.js'
import type { JSXConverters } from '../types.js'

export const UploadJSXConverter: JSXConverters<SerializedUploadNode> = {
  upload: ({ node }) => {
    // TO-DO (v4): SerializedUploadNode should use UploadData_P4
    const uploadNode = node as UploadDataImproved
    if (typeof uploadNode.value !== 'object') {
      return null
    }

    const uploadDoc = uploadNode.value as FileData & TypeWithID

    const url = uploadDoc.url

    /**
     * If the upload is not an image, return a link to the upload
     */
    if (!uploadDoc.mimeType.startsWith('image')) {
      return (
        <a href={url} rel="noopener noreferrer">
          {uploadDoc.filename}
        </a>
      )
    }

    /**
     * If the upload is a simple image with no different sizes, return a simple img tag
     */
    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return (
        <img alt={uploadDoc.filename} height={uploadDoc.height} src={url} width={uploadDoc.width} />
      )
    }

    /**
     * If the upload is an image with different sizes, return a picture element
     */
    const pictureJSX: React.ReactNode[] = []

    // Iterate through each size in the data.sizes object
    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size] as FileSizeImproved

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
        />,
      )
    }

    // Add the default img tag
    pictureJSX.push(
      <img
        alt={uploadDoc?.filename}
        height={uploadDoc?.height}
        key={'image'}
        src={url}
        width={uploadDoc?.width}
      />,
    )
    return <picture>{pictureJSX}</picture>
  },
}
