import type { JSONSchemaFn } from '../../typesServer.js'

export interface SerializedHorizontalRuleNode {
  type: 'horizontalrule'
  version: number
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedHorizontalRuleNode` declared above. */
const SERIALIZED_HORIZONTAL_RULE_NODE_TS = `export interface SerializedHorizontalRuleNode {
  type: 'horizontalrule';
  version: number;
}`

export const horizontalRuleNodeJSONSchema: JSONSchemaFn = ({ typeStringDefinitions }) => {
  typeStringDefinitions.add(SERIALIZED_HORIZONTAL_RULE_NODE_TS)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', const: 'horizontalrule' },
      version: { type: 'integer' },
    },
    required: ['type', 'version'],
    tsType: 'SerializedHorizontalRuleNode',
  }
}
