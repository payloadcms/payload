import type { LexicalNode } from 'lexical'
import type { PayloadRequest } from 'payload'

import { type I18nClient } from '@payloadcms/translations'

import './index.scss'

import { createHash } from 'crypto'

import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js'
import type { SerializedBlockNode } from '../../../../nodeTypes.js'

const baseClass = 'lexical-unknown-diff'

export const UnknownDiffHTMLConverterAsync: (args: {
  i18n: I18nClient
  req: PayloadRequest
}) => HTMLConvertersAsync<LexicalNode> = ({ i18n, req }) => {
  return {
    unknown: async ({ node, providedCSSString }) => {
      const ReactDOMServer = (await import('react-dom/server')).default

      // hash fields to ensure they are diffed if they change
      const nodeFieldsHash = createHash('sha256')
        .update(JSON.stringify(node ?? {}))
        .digest('hex')

      let nodeType = node.type

      let nodeTypeSpecifier: null | string = null

      if (node.type === 'block') {
        nodeTypeSpecifier = (node as SerializedBlockNode).fields.blockType
        nodeType = 'Block'
      } else if (node.type === 'inlineBlock') {
        nodeTypeSpecifier = (node as SerializedBlockNode).fields.blockType
        nodeType = 'InlineBlock'
      }

      const JSX = (
        <div
          className={`${baseClass}${providedCSSString}`}
          data-enable-match="true"
          data-fields-hash={`${nodeFieldsHash}`}
        >
          {nodeTypeSpecifier && (
            <span className={`${baseClass}__specifier`}>{nodeTypeSpecifier}&nbsp;</span>
          )}
          <span>{nodeType}</span>
          <div className={`${baseClass}__meta`}>
            <br />
          </div>
        </div>
      )

      // Render to HTML
      const html = ReactDOMServer.renderToString(JSX)

      return html
    },
  }
}
