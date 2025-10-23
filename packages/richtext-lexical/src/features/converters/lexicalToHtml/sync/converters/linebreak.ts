import type { SerializedLineBreakNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const LinebreakHTMLConverter: HTMLConverters<SerializedLineBreakNode> = {
  linebreak: '<br />',
}
