/**
 * Code taken from https://github.com/facebook/lexical/blob/main/packages/lexical-markdown/src/MarkdownTransformers.ts#L357
 */

// Order of text transformers matters:
//
// - code should go first as it prevents any transformations inside

import { $createTextNode, $isTextNode } from 'lexical'

import type { TextMatchTransformer } from '../../packages/@lexical/markdown/MarkdownTransformers.js'

import { $createLinkNode, $isLinkNode, LinkNode } from './nodes/LinkNode.js'

// - then longer tags match (e.g. ** or __ should go before * or _)
export const LinkMarkdownTransformer: TextMatchTransformer = {
  type: 'text-match',
  dependencies: [LinkNode],
  export: (_node, exportChildren) => {
    if (!$isLinkNode(_node)) {
      return null
    }
    const node: LinkNode = _node
    const { url } = node.getFields()

    const textContent = exportChildren(node)

    const linkContent = `[${textContent}](${url})`

    return linkContent
  },
  importRegExp: /\[([^[]+)\]\(([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?\)/,
  regExp: /\[([^[]+)\]\(([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?\)$/,
  replace: (textNode, match) => {
    const [, linkText, linkUrl] = match
    const linkNode = $createLinkNode({
      fields: {
        doc: null,
        linkType: 'custom',
        newTab: false,
        url: linkUrl,
      },
    })
    const linkTextNode = $createTextNode(linkText)
    linkTextNode.setFormat(textNode.getFormat())
    linkNode.append(linkTextNode)
    textNode.replace(linkNode)

    return linkTextNode
  },
  trigger: ')',
}
