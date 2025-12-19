/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { SerializedLexicalNodeWithParent } from '../shared/types.js'
import type { HTMLConverter, HTMLConverters, HTMLConvertersFunction } from './types.js'

import { hasText } from '../../../../validate/hasText.js'
import { findConverterForNode } from '../shared/findConverterForNode.js'
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
}

export function convertLexicalToHTML({
  className,
  converters,
  data,
  disableContainer,
  disableIndent,
  disableTextAlign,
}: ConvertLexicalToHTMLArgs): string {
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

    const html = convertLexicalNodesToHTML({
      converters: finalConverters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root,
    }).join('')

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

      htmlArray.push(nodeHTML)
    } catch (error) {
      console.error('Error converting lexical node to HTML:', error, 'node:', node)
      htmlArray.push('')
    }
  }

  return htmlArray.filter(Boolean)
}
