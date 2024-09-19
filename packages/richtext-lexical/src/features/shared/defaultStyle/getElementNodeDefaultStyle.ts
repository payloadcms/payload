import type { SerializedElementNode } from 'lexical'

const convertStyleObjectToString = (style: Record<string, unknown>): string => {
  let styleString = ''
  const styleEntries = Object.entries(style)
  for (const styleEntry of styleEntries) {
    const [styleKey, styleValue] = styleEntry
    if (
      styleValue === null ||
      styleValue === undefined ||
      (typeof styleValue === 'string' && styleValue === '')
    ) {
      continue
    }
    styleString += `${styleKey}: ${String(styleValue)};`
  }
  return styleString
}

export const getAlignStyle = (node: SerializedElementNode) => {
  return { 'text-align': node.format }
}

export const getIndentStyle = (node: SerializedElementNode) => {
  if (!node.indent) {
    return {}
  }
  /**
   * https://github.com/facebook/lexical/blob/da405bba0511ba26191e56ec8d7c7770b36c59f0/packages/lexical/src/nodes/LexicalParagraphNode.ts#L156-L157
   * Lexical renders indent with padding-inline-start, but it use text-indent for RTL supports and widely supports.
   * */
  return { 'text-indent': `${node.indent * 20}px` }
}

interface GetElementNodeDefaultStyleProps {
  node: SerializedElementNode
  styleConverters?: ((node: SerializedElementNode) => Record<string, string>)[]
}

export const getElementNodeDefaultStyle = ({
  node,
  styleConverters = [getAlignStyle, getIndentStyle],
}: GetElementNodeDefaultStyleProps) => {
  const convertedStyleObject = styleConverters.reduce(
    (prevObject, styleConverter) => {
      return {
        ...prevObject,
        ...styleConverter(node),
      }
    },
    {} as Record<string, string>,
  )

  return convertStyleObjectToString(convertedStyleObject)
}
