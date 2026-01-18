import { type EditorConfig, type LexicalEditor, type LexicalNode } from 'lexical';
import { type JSX } from 'react';
import type { BlockFieldsOptionalID, SerializedBlockNode } from '../../server/nodes/BlocksNode.js';
import { ServerBlockNode } from '../../server/nodes/BlocksNode.js';
export declare class BlockNode extends ServerBlockNode {
    static clone(node: ServerBlockNode): ServerBlockNode;
    static getType(): string;
    static importJSON(serializedNode: SerializedBlockNode): BlockNode;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
    exportJSON(): SerializedBlockNode;
}
export declare function $createBlockNode(fields: BlockFieldsOptionalID): BlockNode;
export declare function $isBlockNode(node: BlockNode | LexicalNode | null | undefined): node is BlockNode;
//# sourceMappingURL=BlocksNode.d.ts.map