import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../index'

type Converter = HTMLConverter<any>

type ConverterFunctionParams = Parameters<Converter['converter']>[0]

async function convertFunction({
  converters,
  node,
  parent,
}: ConverterFunctionParams): Promise<string> {
  const filteredSelfConverters = converters.filter(
    (converter) => converter.converter !== convertFunction,
  )

  let text = await convertLexicalNodesToHTML({
    converters: filteredSelfConverters,
    lexicalNodes: [node],
    parent,
  })

  const styleArray = []

  if (node.indent) {
    styleArray.push('text-align: ' + node.format)
  }

  const firstTag = text.slice(0, text.indexOf('>') + 1)
  if (styleArray.length > 0) {
    if (firstTag.includes('style')) {
      text = text.replace('style="', `style="${styleArray.join('; ')};`)
    } else {
      text = text.replace('>', ` style="${styleArray.join('; ')};">`)
    }
  }

  return text
}

export const AlignHTMLConverter: Converter = {
  converter: convertFunction,
  nodeTypes: ['paragraph', 'heading', 'listitem', 'quote'],
}
