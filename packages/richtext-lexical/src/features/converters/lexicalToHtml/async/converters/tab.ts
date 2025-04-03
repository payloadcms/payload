import type { SerializedTabNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

export const TabHTMLConverterAsync: HTMLConvertersAsync<SerializedTabNode> = {
  tab: '\t',
}
