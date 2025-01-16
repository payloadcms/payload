import type { SerializedTabNode } from '../../../../../nodeTypes.js'
import type { HTMLConverter } from '../types.js'

export const TabHTMLConverter: HTMLConverter<SerializedTabNode> = {
  converter({ node }) {
    return node.text
  },
  nodeTypes: ['tab'],
}
