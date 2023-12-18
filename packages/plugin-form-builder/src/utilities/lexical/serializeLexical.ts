import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types'

import { defaultHTMLConverters } from './defaultConverters'

export async function serializeLexical(data?: any, submissionData?: any): Promise<string> {
  const converters: HTMLConverter[] = defaultHTMLConverters

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
  lexicalNodes: any[]
  parent: SerializedLexicalNodeWithParent
}): Promise<string> {
  const unknownConverter = converters.find((converter) => converter.nodeTypes.includes('unknown'))

  const htmlArray = await Promise.all(
    lexicalNodes.map(async (node, i) => {
      const converterForNode = converters.find((converter) =>
        converter.nodeTypes.includes(node.type),
      )
      if (!converterForNode) {
        if (unknownConverter) {
          return unknownConverter.converter({ childIndex: i, converters, node, parent })
        }
        return '<span>unknown node</span>'
      }
      return converterForNode.converter({
        childIndex: i,
        converters,
        node,
        parent,
      })
    }),
  )

  return htmlArray.join('') || ''
}
