/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../nodeTypes.js'
import type {
  HTMLConverter,
  HTMLConverters,
  ProvidedCSS,
  SerializedLexicalNodeWithParent,
} from './types.js'

import { hasText } from '../../../validate/hasText.js'

export type ConvertLexicalToHTMLArgs = {
  converters: HTMLConverters
  data: SerializedEditorState
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
}

export function convertLexicalToHTML({
  converters,
  data,
  disableIndent,
  disableTextAlign,
}: ConvertLexicalToHTMLArgs): string {
  if (hasText(data)) {
    return convertLexicalNodesToHTML({
      converters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root,
    }).join('')
  }
  return ''
}

export function convertLexicalNodesToHTML({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
}: {
  converters: HTMLConverters
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  nodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
}): string[] {
  const unknownConverter: HTMLConverter<any> = converters.unknown as HTMLConverter<any>

  const htmlArray: string[] = nodes.map((node, i) => {
    let converterForNode: HTMLConverter<any> | undefined
    if (node.type === 'block') {
      converterForNode = converters?.blocks?.[(node as SerializedBlockNode)?.fields?.blockType]
      if (!converterForNode) {
        console.error(
          `Lexical => HTML converter: Blocks converter: found ${(node as SerializedBlockNode)?.fields?.blockType} block, but no converter is provided`,
        )
      }
    } else if (node.type === 'inlineBlock') {
      converterForNode =
        converters?.inlineBlocks?.[(node as SerializedInlineBlockNode)?.fields?.blockType]
      if (!converterForNode) {
        console.error(
          `Lexical => HTML converter: Inline Blocks converter: found ${(node as SerializedInlineBlockNode)?.fields?.blockType} inline block, but no converter is provided`,
        )
      }
    } else {
      converterForNode = converters[node.type] as HTMLConverter<any>
    }

    const style: ProvidedCSS = {}

    // Check if disableTextAlign is not true and does not include node type
    if (
      !disableTextAlign &&
      (!Array.isArray(disableTextAlign) || !disableTextAlign?.includes(node.type))
    ) {
      if ('format' in node && node.format) {
        switch (node.format) {
          case 'center':
            style['text-align'] = 'center'
            break
          case 'end':
            style['text-align'] = 'right'
            break
          case 'justify':
            style['text-align'] = 'justify'
            break
          case 'left':
            //style['text-align'] = 'left'
            // Do nothing, as left is the default
            break
          case 'right':
            style['text-align'] = 'right'
            break
          case 'start':
            style['text-align'] = 'left'
            break
        }
      }
    }

    if (!disableIndent && (!Array.isArray(disableIndent) || !disableIndent?.includes(node.type))) {
      if ('indent' in node && node.indent && node.type !== 'listitem') {
        style['padding-inline-start'] = `${Number(node.indent) * 2}em`
      }
    }

    let providedCSSString: string = ''
    for (const key of Object.keys(style)) {
      // @ts-expect-error we're iterating over the keys of the object
      providedCSSString += `${key}: ${style[key]};`
    }
    const providedStyleTag = providedCSSString?.length ? ` style="${providedCSSString}"` : ''

    try {
      if (!converterForNode && unknownConverter) {
        converterForNode = unknownConverter
      }

      let nodeHTML: string

      if (converterForNode) {
        const converted =
          typeof converterForNode === 'function'
            ? converterForNode({
                childIndex: i,
                converters,
                node,
                nodesToHTML: (args) => {
                  return convertLexicalNodesToHTML({
                    converters: args.converters ?? converters,
                    disableIndent: args.disableIndent ?? disableIndent,
                    disableTextAlign: args.disableTextAlign ?? disableTextAlign,
                    nodes: args.nodes,
                    parent: args.parent ?? {
                      ...node,
                      parent,
                    },
                  })
                },
                parent,
                providedCSSString,
                providedStyleTag,
              })
            : converterForNode
        nodeHTML = converted
      } else {
        nodeHTML = '<span>unknown node</span>'
      }

      return nodeHTML
    } catch (error) {
      console.error('Error converting lexical node to HTML:', error, 'node:', node)
      return ''
    }
  })

  return htmlArray.filter(Boolean)
}
