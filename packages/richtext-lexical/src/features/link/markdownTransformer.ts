/**
 * Code taken from https://github.com/facebook/lexical/blob/main/packages/lexical-markdown/src/MarkdownTransformers.ts#L357
 */

// Order of text transformers matters:
//
// - code should go first as it prevents any transformations inside

import { $createTextNode, $isTextNode } from 'lexical'

import type { TextMatchTransformer } from '../../packages/@lexical/markdown/MarkdownTransformers.js'
import type { SerializedLinkNode } from './nodes/types.js'

import { sanitizeUrl } from '../../lexical/utils/url.js'
import { $createLinkNode, $isLinkNode, LinkNode } from './nodes/LinkNode.js'

// - then longer tags match (e.g. ** or __ should go before * or _)

export type CreateLinkMarkdownTransformerArgs = {
  /**
   * A function that receives a serialized internal link node and returns the URL string.
   * Required for internal links (linkType === 'internal') to be exported correctly, since
   * internal links store a doc reference rather than a URL.
   *
   * Without this, internal links will export as `[text]()` with an empty href.
   */
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}

const replaceTransformer: TextMatchTransformer['replace'] = (textNode, match) => {
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
}

export const createLinkMarkdownTransformer = (
  args?: CreateLinkMarkdownTransformerArgs,
): TextMatchTransformer => ({
  type: 'text-match',
  dependencies: [LinkNode],
  export: (_node, exportChildren) => {
    if (!$isLinkNode(_node)) {
      return null
    }
    const node: LinkNode = _node
    const fields = node.getFields()

    let url: string

    if (fields.linkType === 'internal') {
      if (args?.internalDocToHref) {
        url = sanitizeUrl(args.internalDocToHref({ linkNode: node.exportJSON() }))
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          'Lexical → Markdown converter: found internal link but internalDocToHref is not provided — link will have an empty href',
        )
        url = ''
      }
    } else {
      url = sanitizeUrl(fields.url ?? '')
    }

    const textContent = exportChildren(node)
    return `[${textContent}](${url})`
  },
  importRegExp: /(?<!!)\[([^[]+)\]\(([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?\)/,
  regExp: /(?<!!)\[([^[]+)\]\(([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?\)$/,
  replace: replaceTransformer,
  trigger: ')',
})

export const LinkMarkdownTransformer: TextMatchTransformer = createLinkMarkdownTransformer()
