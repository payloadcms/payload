import type { SerializedLineBreakNode } from '../../../../../nodeTypes.js'
import type { HTMLConverter } from '../types.js'

export const LinebreakHTMLConverter: HTMLConverter<SerializedLineBreakNode> = {
  converter() {
    return `<br>`
  },
  nodeTypes: ['linebreak'],
}
