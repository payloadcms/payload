/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { SerializedLexicalNodeWithParent } from '../shared/types.js'
import type {
  HTMLConverterAsync,
  HTMLConvertersAsync,
  HTMLConvertersFunctionAsync,
  HTMLPopulateFn,
} from './types.js'

import { hasText } from '../../../../validate/hasText.js'
import { findConverterForNode } from '../shared/findConverterForNode.js'
import { defaultHTMLConvertersAsync } from './defaultConverters.js'

export type ConvertLexicalToHTMLAsyncArgs = {
  /**
   * Override class names for the container.
   */
  className?: string
  converters?: HTMLConvertersAsync | HTMLConvertersFunctionAsync
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

export async function convertLexicalToHTMLAsync({
  className,
  converters,
  data,
  disableContainer,
  disableIndent,
  disableTextAlign,
  populate,
}: ConvertLexicalToHTMLAsyncArgs): Promise<string> {
  if (hasText(data)) {
    let finalConverters: HTMLConvertersAsync = {}
    if (converters) {
      if (typeof converters === 'function') {
        finalConverters = converters({ defaultConverters: defaultHTMLConvertersAsync })
      } else {
        finalConverters = converters
      }
    } else {
      finalConverters = defaultHTMLConvertersAsync
    }

    const html = (
      await convertLexicalNodesToHTMLAsync({
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

export async function convertLexicalNodesToHTMLAsync({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
  populate,
}: {
  converters: HTMLConvertersAsync
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
  nodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
  populate?: HTMLPopulateFn
}): Promise<string[]> {
  const unknownConverter: HTMLConverterAsync<any> = converters.unknown as HTMLConverterAsync<any>

  const htmlArray: string[] = []

  let i = -1
  for (const node of nodes) {
    i++
    const { converterForNode, providedCSSString, providedStyleTag } = findConverterForNode({
      converters,
      disableIndent,
      disableTextAlign,
      node,
      unknownConverter,
    })

    try {
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
                  return await convertLexicalNodesToHTMLAsync({
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
