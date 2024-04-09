import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types'

export async function convertLexicalToHTML({
  converters,
  data,
}: {
  converters: HTMLConverter[]
  data: SerializedEditorState
}): Promise<string> {
  if (data?.root?.children?.length) {
    return await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: data?.root?.children,
      parent: data?.root,
    })
  }
  return ''
}

export async function convertLexicalNodesToHTML({
  converters,
  lexicalNodes,
  parent,
}: {
  converters: HTMLConverter[]
  lexicalNodes: SerializedLexicalNode[]
  parent: SerializedLexicalNodeWithParent
}): Promise<string> {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))

  const htmlArray = await Promise.all(
    lexicalNodes.map(async (node, i) => {
      const converterForNode = converters.find((converter) =>
        converter.nodeTypes.includes(node.type),
      )
      try {
        if (!converterForNode) {
          if (unknownConverter) {
            return await unknownConverter.converter({ childIndex: i, converters, node, parent })
          }
          return '<span>unknown node</span>'
        }
        return converterForNode.converter({
          childIndex: i,
          converters,
          node,
          parent,
        })
      } catch (error) {
        console.error('Error converting lexical node to HTML:', error, 'node:', node)
        return ''
      }
    }),
  )

  return htmlArray.join('') || ''
}
