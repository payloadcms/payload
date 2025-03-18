import type { FileData, PayloadRequest, TypeWithID } from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { File } from '@payloadcms/ui/shared'

import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js'

import './index.scss'

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

      const JSX = (
        <div className={`${baseClass}${providedCSSString}`}>
          <div className={`${baseClass}__card`}>
            <div className={`${baseClass}__topRow`}>
              <div className={`${baseClass}__thumbnail`}>
                {thumbnailSRC?.length ? (
                  <img
                    alt={uploadDoc?.filename}
                    data-enable-match="true"
                    data-lexical-upload-id={uploadNode.value}
                    data-lexical-upload-relation-to={uploadNode.relationTo}
                    src={thumbnailSRC}
                  />
                ) : (
                  <File />
                )}
              </div>
              <div className={`${baseClass}__topRowRightPanel`}>
                <div className={`${baseClass}__collectionLabel`}>
                  {relatedCollection?.labels?.singular
                    ? getTranslation(relatedCollection.labels.singular, i18n)
                    : ''}
                </div>
                <strong>{uploadDoc?.filename}</strong>
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
