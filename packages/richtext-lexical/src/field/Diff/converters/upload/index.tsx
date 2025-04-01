import type { FileData, PayloadRequest, TypeWithID } from 'payload'

import { type I18nClient } from '@payloadcms/translations'
import { File } from '@payloadcms/ui/rsc'
import { createHash } from 'crypto'

import './index.scss'

import { formatFilesize } from 'payload/shared'
import React from 'react'

import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js'
import type { UploadDataImproved } from '../../../../features/upload/server/nodes/UploadNode.js'
import type { SerializedUploadNode } from '../../../../nodeTypes.js'

const baseClass = 'lexical-upload-diff'

export const UploadDiffHTMLConverterAsync: (args: {
  i18n: I18nClient
  req: PayloadRequest
}) => HTMLConvertersAsync<SerializedUploadNode> = ({ i18n, req }) => {
  return {
    upload: async ({ node, populate, providedCSSString }) => {
      const uploadNode = node as UploadDataImproved

      let uploadDoc: (FileData & TypeWithID) | undefined = undefined

      // If there's no valid upload data, populate return an empty string
      if (typeof uploadNode.value !== 'object') {
        if (!populate) {
          return ''
        }
        uploadDoc = await populate<FileData & TypeWithID>({
          id: uploadNode.value,
          collectionSlug: uploadNode.relationTo,
        })
      } else {
        uploadDoc = uploadNode.value as unknown as FileData & TypeWithID
      }

      if (!uploadDoc) {
        return ''
      }

      const relatedCollection = req.payload.collections[uploadNode.relationTo]?.config

      const thumbnailSRC: string =
        ('thumbnailURL' in uploadDoc && (uploadDoc?.thumbnailURL as string)) || uploadDoc?.url || ''

      const ReactDOMServer = (await import('react-dom/server')).default

      // hash fields to ensure they are diffed if they change
      const nodeFieldsHash = createHash('sha256')
        .update(JSON.stringify(node.fields ?? {}))
        .digest('hex')

      const JSX = (
        <div
          className={`${baseClass}${providedCSSString}`}
          data-enable-match="true"
          data-fields-hash={`${nodeFieldsHash}`}
          data-filename={uploadDoc?.filename}
          data-lexical-upload-id={uploadNode.value}
          data-lexical-upload-relation-to={uploadNode.relationTo}
          data-src={thumbnailSRC}
        >
          <div className={`${baseClass}__card`}>
            <div className={`${baseClass}__thumbnail`}>
              {thumbnailSRC?.length ? (
                <img alt={uploadDoc?.filename} src={thumbnailSRC} />
              ) : (
                <File />
              )}
            </div>
            <div className={`${baseClass}__info`}>
              <strong>{uploadDoc?.filename}</strong>
              <div className={`${baseClass}__meta`}>
                {formatFilesize(uploadDoc?.filesize)}
                {typeof uploadDoc?.width === 'number' && typeof uploadDoc?.height === 'number' && (
                  <React.Fragment>
                    &nbsp;-&nbsp;
                    {uploadDoc?.width}x{uploadDoc?.height}
                  </React.Fragment>
                )}
                {uploadDoc?.mimeType && (
                  <React.Fragment>
                    &nbsp;-&nbsp;
                    {uploadDoc?.mimeType}
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
        </div>
      )

      // Render to HTML
      const html = ReactDOMServer.renderToString(JSX)

      return html
    },
  }
}
