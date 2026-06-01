import type { FileData, PayloadRequest, TypeWithID } from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'

import './index.css'

import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js'
import type { SerializedRelationshipNode } from '../../../../types/nodeTypes.js'

const baseClass = 'lexical-relationship-diff'

export const RelationshipDiffHTMLConverterAsync: (args: {
  i18n: I18nClient
  req: PayloadRequest
}) => HTMLConvertersAsync<SerializedRelationshipNode> = ({ i18n, req }) => {
  return {
    relationship: async ({ node, populate, providedCSSString }) => {
      let data: (Record<string, any> & TypeWithID) | undefined

      const id = typeof node.value === 'object' ? node.value.id : node.value

      // If there's no valid upload data, populate return an empty string
      if (typeof node.value !== 'object') {
        if (!populate) {
          return ''
        }
        data = await populate<FileData & TypeWithID>({
          id,
          collectionSlug: node.relationTo,
        })
      } else {
        data = node.value
      }

      const relatedCollection = req.payload.collections[node.relationTo]?.config

      const ReactDOMServer = (await import('react-dom/server')).default

      const JSX = (
        <div
          className={`${baseClass}${providedCSSString}`}
          data-enable-match="true"
          data-id={id}
          data-slug={node.relationTo}
        >
          {relatedCollection?.labels?.singular && (
            <span className={`${baseClass}__pill`} data-enable-match="false">
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </span>
          )}
          <strong className={`${baseClass}__info`} data-enable-match="false">
            {data &&
            relatedCollection?.admin?.useAsTitle &&
            data[relatedCollection.admin.useAsTitle]
              ? data[relatedCollection.admin.useAsTitle]
              : (id as string)}
          </strong>
        </div>
      )

      // Render to HTML
      const html = ReactDOMServer.renderToStaticMarkup(JSX)

      return html
    },
  }
}
