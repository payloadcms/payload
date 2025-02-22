import type { SerializedLineBreakNode } from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const LinebreakJSXConverter: JSXConverters<SerializedLineBreakNode> = {
  linebreak: <br />,
}
