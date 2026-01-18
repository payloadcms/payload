import type { LexicalNode, SerializedLexicalNode } from 'lexical';
import type { SerializedHorizontalRuleNode } from '../../server/nodes/HorizontalRuleNode.js';
import { HorizontalRuleServerNode } from '../../server/nodes/HorizontalRuleNode.js';
export declare class HorizontalRuleNode extends HorizontalRuleServerNode {
    static clone(node: HorizontalRuleServerNode): HorizontalRuleServerNode;
    static getType(): string;
    /**
     * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
     */
    static importJSON(serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode;
    /**
     * Allows you to render a React component within whatever createDOM returns.
     */
    decorate(): null;
    exportJSON(): SerializedLexicalNode;
}
export declare function $createHorizontalRuleNode(): HorizontalRuleNode;
export declare function $isHorizontalRuleNode(node: LexicalNode | null | undefined): node is HorizontalRuleNode;
//# sourceMappingURL=HorizontalRuleNode.d.ts.map