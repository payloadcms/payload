import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import type { JSX } from 'react';
import { DecoratorNode } from 'lexical';
export type UnknownConvertedNodeData = {
    nodeData: unknown;
    nodeType: string;
};
export type SerializedUnknownConvertedNode = Spread<{
    data: UnknownConvertedNodeData;
}, SerializedLexicalNode>;
/** @noInheritDoc */
export declare class UnknownConvertedNode extends DecoratorNode<JSX.Element> {
    __data: UnknownConvertedNodeData;
    constructor({ data, key }: {
        data: UnknownConvertedNodeData;
        key?: NodeKey;
    });
    static clone(node: UnknownConvertedNode): UnknownConvertedNode;
    static getType(): string;
    static importJSON(serializedNode: SerializedUnknownConvertedNode): UnknownConvertedNode;
    canInsertTextAfter(): true;
    canInsertTextBefore(): true;
    createDOM(config: EditorConfig): HTMLElement;
    decorate(): JSX.Element;
    exportJSON(): SerializedUnknownConvertedNode;
    isInline(): boolean;
    updateDOM(prevNode: this, dom: HTMLElement): boolean;
}
export declare function $createUnknownConvertedNode({ data, }: {
    data: UnknownConvertedNodeData;
}): UnknownConvertedNode;
export declare function $isUnknownConvertedNode(node: LexicalNode | null | undefined): node is UnknownConvertedNode;
//# sourceMappingURL=index.d.ts.map