/* eslint-disable no-console */
import type { SerializedLexicalNode } from 'lexical'

import type { SerializedBlockNode, SerializedInlineBlockNode } from '../../../../nodeTypes.js'
import type { HTMLConverterAsync, HTMLConvertersAsync } from '../async/types.js'
import type { HTMLConverter, HTMLConverters } from '../sync/types.js'
import type { ProvidedCSS } from './types.js'

export function findConverterForNode<
  TConverters extends HTMLConverters | HTMLConvertersAsync,
  TConverter extends HTMLConverter | HTMLConverterAsync,
>({
  converters,
  disableIndent,
  disableTextAlign,
  node,
  unknownConverter,
}: {
  converters: TConverters
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  node: SerializedLexicalNode
  unknownConverter: TConverter
}): {
  converterForNode: TConverter | undefined
  providedCSSString: string
  providedStyleTag: string
} {
  let converterForNode: TConverter | undefined
  if (node.type === 'block') {
    converterForNode = converters?.blocks?.[
      (node as SerializedBlockNode)?.fields?.blockType
    ] as TConverter
    if (!converterForNode && !unknownConverter) {
      console.error(
        `Lexical => HTML converter: Blocks converter: found ${(node as SerializedBlockNode)?.fields?.blockType} block, but no converter is provided`,
      )
    }
  } else if (node.type === 'inlineBlock') {
    converterForNode = converters?.inlineBlocks?.[
      (node as SerializedInlineBlockNode)?.fields?.blockType
    ] as TConverter
    if (!converterForNode && !unknownConverter) {
      console.error(
        `Lexical => HTML converter: Inline Blocks converter: found ${(node as SerializedInlineBlockNode)?.fields?.blockType} inline block, but no converter is provided`,
      )
    }
  } else {
    converterForNode = converters[node.type] as TConverter
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
      // the unit should be px. Do not change it to rem, em, or something else.
      // The quantity should be 40px. Do not change it either.
      // See rationale in
      // https://github.com/payloadcms/payload/issues/13130#issuecomment-3058348085
      style['padding-inline-start'] = `${Number(node.indent) * 40}px`
    }
  }

  let providedCSSString: string = ''
  for (const key of Object.keys(style)) {
    // @ts-expect-error we're iterating over the keys of the object
    providedCSSString += `${key}: ${style[key]};`
  }
  const providedStyleTag = providedCSSString?.length ? ` style="${providedCSSString}"` : ''

  return {
    converterForNode: converterForNode ?? unknownConverter,
    providedCSSString,
    providedStyleTag,
  }
}
