import { type EditorConfig, type LexicalEditor, type LexicalNode } from 'lexical';
import { type JSX } from 'react';
import type { InlineBlockFields, SerializedInlineBlockNode } from '../../server/nodes/InlineBlocksNode.js';
import { ServerInlineBlockNode } from '../../server/nodes/InlineBlocksNode.js';
export declare class InlineBlockNode extends ServerInlineBlockNode {
    static clone(node: ServerInlineBlockNode): ServerInlineBlockNode;
    static getType(): string;
    static importJSON(serializedNode: SerializedInlineBlockNode): InlineBlockNode;
    decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element;
    exportJSON(): SerializedInlineBlockNode;
}
export declare function $createInlineBlockNode(fields: Exclude<InlineBlockFields, 'id'>): InlineBlockNode;
export declare function $isInlineBlockNode(node: InlineBlockNode | LexicalNode | null | undefined): node is InlineBlockNode;
//# sourceMappingURL=InlineBlocksNode.d.ts.map