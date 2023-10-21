import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import type { HTMLConverter } from './types'

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
      parentNodeType: 'root',
    })
  }
  return ''
}

export async function convertLexicalNodesToHTML({
  converters,
  lexicalNodes,
  parentNodeType,
}: {
  converters: HTMLConverter[]
  lexicalNodes: SerializedLexicalNode[]
  parentNodeType: string
}): Promise<string> {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))

  const htmlArray = await Promise.all(
    lexicalNodes.map(async (node, i) => {
      const converterForNode = converters.find((converter) =>
        converter.nodeTypes.includes(node.type),
      )
      if (!converterForNode) {
        return '<span>unknown node</span>'
      }
      const html = await converterForNode.converter({
        childIndex: i,
        converters,
        node,
        parentNodeType,
      })
      return html
    }),
  )

  return htmlArray.join('') || ''
}
