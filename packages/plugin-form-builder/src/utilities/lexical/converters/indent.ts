import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../serializeLexical'

type Converter = HTMLConverter<any>

type ConverterFunctionParams = Parameters<Converter['converter']>[0]

async function convertFunction({
  converters,
  node,
  parent,
  submissionData,
}: ConverterFunctionParams): Promise<string> {
  const filteredSelfConverters = converters.filter(
    (converter) => converter.converter !== convertFunction,
  )

  let text = await convertLexicalNodesToHTML({
    converters: filteredSelfConverters,
    lexicalNodes: [node],
    parent,
    submissionData,
  })

  const styleArray = []

  if (node.indent) {
    styleArray.push(`padding-inline-start: ${node.indent * 20}px`)
  }

  const firstTag = text.slice(0, text.indexOf('>') + 1)
  if (styleArray.length > 0) {
    if (firstTag.includes('style')) {
      text = text.replace('style="', `style="${styleArray.join('; ')}`)
    } else {
      text = text.replace('>', ` style="${styleArray.join('; ')}">`)
    }
  }

  return text
}

export const IndentHTMLConverter: Converter = {
  converter: convertFunction,
  nodeTypes: ['paragraph', 'heading', 'listitem', 'quote'],
}
