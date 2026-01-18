import type { DOMConversionMap, DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode } from 'lexical';
import type { JsonObject } from 'payload';
import type React from 'react';
import type { JSX } from 'react';
import { DecoratorNode } from 'lexical';
import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js';
export type InlineBlockFields<TInlineBlockFields extends JsonObject = JsonObject> = {
    blockType: string;
    id: string;
} & TInlineBlockFields;
export type SerializedInlineBlockNode<TBlockFields extends JsonObject = JsonObject> = {
    fields: InlineBlockFields<TBlockFields>;
} & StronglyTypedLeafNode<SerializedLexicalNode, 'inlineBlock'>;
export declare class ServerInlineBlockNode extends DecoratorNode<null | React.ReactElement> {
    __cacheBuster: number;
    __fields: InlineBlockFields;
    constructor({ cacheBuster, fields, key, }: {
        cacheBuster?: number;
        fields: InlineBlockFields;
        key?: NodeKey;
    });
    static clone(node: ServerInlineBlockNode): ServerInlineBlockNode;
    static getType(): string;
    static importDOM(): DOMConversionMap<HTMLDivElement> | null;
    static importJSON(serializedNode: SerializedInlineBlockNode): ServerInlineBlockNode;
    static isInline(): false;
    canIndent(): boolean;
    createDOM(config?: EditorConfig): HTMLElement;
    decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element | null;
    exportDOM(): DOMExportOutput;
    exportJSON(): SerializedInlineBlockNode;
    getCacheBuster(): number;
    getFields(): InlineBlockFields;
    getTextContent(): string;
    isInline(): boolean;
    setFields(fields: InlineBlockFields, preventFormStateUpdate?: boolean): void;
    updateDOM(): boolean;
}
export declare function $createServerInlineBlockNode(fields: Exclude<InlineBlockFields, 'id'>): ServerInlineBlockNode;
export declare function $isServerInlineBlockNode(node: LexicalNode | null | ServerInlineBlockNode | undefined): node is ServerInlineBlockNode;
//# sourceMappingURL=InlineBlocksNode.d.ts.map