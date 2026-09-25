import type { SerializedLineBreakNode } from '../../../../../types/nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const LinebreakJSXConverter: JSXConverters<SerializedLineBreakNode> = {
  linebreak: <br />,
}
