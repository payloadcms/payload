import type { SerializedLineBreakNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

export const LinebreakHTMLConverterAsync: HTMLConvertersAsync<SerializedLineBreakNode> = {
  linebreak: '<br />',
}
