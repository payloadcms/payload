import type { SerializedTabNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const TabHTMLConverter: HTMLConverters<SerializedTabNode> = {
  tab: '\t',
}
