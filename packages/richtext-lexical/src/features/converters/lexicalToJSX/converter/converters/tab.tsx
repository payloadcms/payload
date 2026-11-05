import type { SerializedTabNode } from '../../../../../types/nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const TabJSXConverter: JSXConverters<SerializedTabNode> = {
  tab: '\t',
}
