/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../nodeTypes.js'
import type {
  HTMLConverter,
  HTMLConverters,
  HTMLConvertersFunction,
  HTMLPopulateFn,
  ProvidedCSS,
  SerializedLexicalNodeWithParent,
} from './types.js'

import { hasText } from '../../../validate/hasText.js'
import { defaultHTMLConverters } from './defaultConverters.js'

export type ConvertLexicalToHTMLArgs = {
  /**
   * Override class names for the container.
   */
  className?: string
  converters?: HTMLConverters | HTMLConvertersFunction
  data: SerializedEditorState
  /**
   * If true, removes the container div wrapper.
   */
  disableContainer?: boolean
  /**
   * If true, disables indentation globally. If an array, disables for specific node `type` values.
   */
  disableIndent?: boolean | string[]
  /**
   * If true, disables text alignment globally. If an array, disables for specific node `type` values.
   */
  disableTextAlign?: boolean | string[]
  populate?: HTMLPopulateFn
}

export async function convertLexicalToHTML({
  className,
  converters,
  data,
  disableContainer,
  disableIndent,
  disableTextAlign,
  populate,
}: ConvertLexicalToHTMLArgs): Promise<string> {
  if (hasText(data)) {
    let finalConverters: HTMLConverters = {}
    if (converters) {
      if (typeof converters === 'function') {
        finalConverters = converters({ defaultConverters: defaultHTMLConverters })
      } else {
        finalConverters = converters
      }
    } else {
      finalConverters = defaultHTMLConverters
    }

    const html = (
      await convertLexicalNodesToHTML({
        converters: finalConverters,
        disableIndent,
        disableTextAlign,
        nodes: data?.root?.children,
        parent: data?.root,
        populate,
      })
    ).join('')

    if (disableContainer) {
      return html
    } else {
      return `<div class="${className ?? 'payload-richtext'}">${html}</div>`
    }
  }
  if (disableContainer) {
    return ''
  } else {
    return `<div class="${className ?? 'payload-richtext'}"></div>`
  }
}

export async function convertLexicalNodesToHTML({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
  populate,
}: {
  converters: HTMLConverters
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  nodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
  populate?: HTMLPopulateFn
}): Promise<string[]> {
  const unknownConverter: HTMLConverter<any> = converters.unknown as HTMLConverter<any>

  const htmlArray: string[] = []

  let i = -1
  for (const node of nodes) {
    i++
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
            ? await converterForNode({
                childIndex: i,
                converters,
                node,
                populate,

                nodesToHTML: async (args) => {
                  return await convertLexicalNodesToHTML({
                    converters: args.converters ?? converters,
                    disableIndent: args.disableIndent ?? disableIndent,
                    disableTextAlign: args.disableTextAlign ?? disableTextAlign,
                    nodes: args.nodes,
                    parent: args.parent ?? {
                      ...node,
                      parent,
                    },
                    populate,
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

      htmlArray.push(nodeHTML)
    } catch (error) {
      console.error('Error converting lexical node to HTML:', error, 'node:', node)
      htmlArray.push('')
    }
  }

  return htmlArray.filter(Boolean)
}
