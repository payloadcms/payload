/**
 * Code adapted from https://github.com/facebook/lexical/blob/main/packages/lexical-markdown/src/MarkdownTransformers.ts#L357
 */

import type { TextMatchTransformer } from '@lexical/markdown'

import { $createTextNode } from 'lexical'

import { $createLinkNode, $isLinkNode, LinkNode } from './nodes/LinkNode.js'

/**
 * Unlike other transformers that use Lexical’s defaults, Payload provides
 * a custom transformer for links, since it relies on its own LinkNode.
 *
 * If you’re working with internal links, you’ll need to customize the
 * `export` and `replace` methods of this transformer, as Payload cannot
 * infer the correct URL format on its own.
 */
export const PAYLOAD_LINK_TRANSFORMER: TextMatchTransformer = {
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
