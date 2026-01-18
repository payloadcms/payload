import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { JsonObject } from 'payload';
import type { JSX } from 'react';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import { type DOMConversionMap, type DOMExportOutput, type EditorConfig, type ElementFormatType, type LexicalEditor, type LexicalNode, type NodeKey } from 'lexical';
import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js';
type BaseBlockFields<TBlockFields extends JsonObject = JsonObject> = {
    /** Block form data */
    blockName: string;
    blockType: string;
} & TBlockFields;
export type BlockFields<TBlockFields extends JsonObject = JsonObject> = {
    id: string;
} & BaseBlockFields<TBlockFields>;
export type BlockFieldsOptionalID<TBlockFields extends JsonObject = JsonObject> = {
    id?: string;
} & BaseBlockFields<TBlockFields>;
export type SerializedBlockNode<TBlockFields extends JsonObject = JsonObject> = {
    fields: BlockFields<TBlockFields>;
} & StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'block'>;
export declare class ServerBlockNode extends DecoratorBlockNode {
    __cacheBuster: number;
    __fields: BlockFields;
    constructor({ cacheBuster, fields, format, key, }: {
        cacheBuster?: number;
        fields: BlockFields;
        format?: ElementFormatType;
        key?: NodeKey;
    });
    static clone(node: ServerBlockNode): ServerBlockNode;
    static getType(): string;
    static importDOM(): DOMConversionMap<HTMLDivElement> | null;
    static importJSON(serializedNode: SerializedBlockNode): ServerBlockNode;
    static isInline(): false;
    createDOM(config?: EditorConfig): HTMLElement;
    decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element;
    exportDOM(): DOMExportOutput;
    exportJSON(): SerializedBlockNode;
    getCacheBuster(): number;
    getFields(): BlockFields;
    getTextContent(): string;
    setFields(fields: BlockFields, preventFormStateUpdate?: boolean): void;
}
export declare function $createServerBlockNode(fields: BlockFieldsOptionalID): ServerBlockNode;
export declare function $isServerBlockNode(node: LexicalNode | null | ServerBlockNode | undefined): node is ServerBlockNode;
export {};
//# sourceMappingURL=BlocksNode.d.ts.map