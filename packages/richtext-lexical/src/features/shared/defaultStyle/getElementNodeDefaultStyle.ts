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

const getAlignStyle = (node: SerializedElementNode) => {
  return { 'text-align': node.format }
}

const getIndentStyle = (node: SerializedElementNode) => {
  if (!node.indent) {
    return {}
  }
  // Lexical renders indent with padding-inline-start, but it use text-indent for RTL supports.
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
