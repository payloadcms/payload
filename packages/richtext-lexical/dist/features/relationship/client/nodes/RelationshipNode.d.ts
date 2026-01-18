import type { JSX } from 'react';
import { type DOMConversionMap, type EditorConfig, type LexicalEditor, type LexicalNode } from 'lexical';
import type { RelationshipData, SerializedRelationshipNode } from '../../server/nodes/RelationshipNode.js';
import { RelationshipServerNode } from '../../server/nodes/RelationshipNode.js';
export declare class RelationshipNode extends RelationshipServerNode {
    static clone(node: RelationshipServerNode): RelationshipServerNode;
    static getType(): string;
    static importDOM(): DOMConversionMap<HTMLDivElement> | null;
    static importJSON(serializedNode: SerializedRelationshipNode): RelationshipNode;
    decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element;
    exportJSON(): SerializedRelationshipNode;
}
export declare function $createRelationshipNode(data: RelationshipData): RelationshipNode;
export declare function $isRelationshipNode(node: LexicalNode | null | RelationshipNode | undefined): node is RelationshipNode;
//# sourceMappingURL=RelationshipNode.d.ts.map