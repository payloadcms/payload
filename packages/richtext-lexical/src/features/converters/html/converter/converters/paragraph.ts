import type { SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types.js'

import { getElementNodeDefaultStyle } from '../../../../shared/defaultStyle/getElementNodeDefaultStyle.js'
import { convertLexicalNodesToHTML } from '../index.js'

export const ParagraphHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  async converter({
    converters,
    currentDepth,
    depth,
    draft,
    node,
    overrideAccess,
    parent,
    req,
    showHiddenFields,
  }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      currentDepth,
      depth,
      draft,
      lexicalNodes: node.children,
      overrideAccess,
      parent: {
        ...node,
        parent,
      },
      req,
      showHiddenFields,
    })
    const defaultStyle = getElementNodeDefaultStyle({
      node,
    })
    const style = defaultStyle ? ` style="${defaultStyle}"` : ''

    return `<p${style}>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
