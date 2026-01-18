import type { Block } from 'payload';
import type { NodeValidation } from '../../typesServer.js';
import type { SerializedBlockNode } from './nodes/BlocksNode.js';
import type { SerializedInlineBlockNode } from './nodes/InlineBlocksNode.js';
/**
 * Runs validation for blocks. This function will determine if the rich text field itself is valid. It does not handle
 * block field error paths - this is done by the `beforeChangeTraverseFields` call in the `beforeChange` hook, called from the
 * rich text adapter.
 */
export declare const blockValidationHOC: (blocks: Block[]) => NodeValidation<SerializedBlockNode | SerializedInlineBlockNode>;
//# sourceMappingURL=validate.d.ts.map