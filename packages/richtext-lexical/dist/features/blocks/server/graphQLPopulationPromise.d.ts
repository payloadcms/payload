import type { Block } from 'payload';
import type { PopulationPromise } from '../../typesServer.js';
import type { SerializedInlineBlockNode } from '../server/nodes/InlineBlocksNode.js';
import type { SerializedBlockNode } from './nodes/BlocksNode.js';
export declare const blockPopulationPromiseHOC: (blocks: Block[]) => PopulationPromise<SerializedBlockNode | SerializedInlineBlockNode>;
//# sourceMappingURL=graphQLPopulationPromise.d.ts.map