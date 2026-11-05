import type { SerializedHorizontalRuleNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConverters } from '../types.js'
export const HorizontalRuleHTMLConverter: HTMLConverters<SerializedHorizontalRuleNode> = {
  horizontalrule: '<hr />',
}
