import type { JSONSchemaFn } from '../../typesServer.js'

import { versionSchema } from '../../../types/jsonSchemaHelpers.js'

export interface SerializedHorizontalRuleNode {
  type: 'horizontalrule'
  /** @deprecated Ignored when loading. May be missing from rich text saved through the API, CLI or MCP. */
  version: number
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedHorizontalRuleNode` declared above. */
const SERIALIZED_HORIZONTAL_RULE_NODE_TS = `export interface SerializedHorizontalRuleNode {
  type: 'horizontalrule';
  /** @deprecated Ignored when loading. May be missing from rich text saved through the API, CLI or MCP. */
  version: number;
}`

export const horizontalRuleNodeJSONSchema: JSONSchemaFn = ({ typeStringDefinitions }) => {
  typeStringDefinitions.add(SERIALIZED_HORIZONTAL_RULE_NODE_TS)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', const: 'horizontalrule' },
      version: versionSchema,
    },
    required: ['type'],
    tsType: 'SerializedHorizontalRuleNode',
  }
}
