import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { DOMConversionMap, DOMExportOutput, EditorConfig, ElementFormatType, LexicalNode, NodeKey } from 'lexical';
import type { CollectionSlug, DataFromCollectionSlug, JsonObject, TypedUploadCollection, UploadCollectionSlug } from 'payload';
import type { JSX } from 'react';
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js';
import type { StronglyTypedLeafNode } from '../../../../nodeTypes.js';
export type UploadData<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
    [TCollectionSlug in CollectionSlug]: {
        fields: TUploadExtraFieldsData;
        /**
         * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
         */
        id: string;
        relationTo: TCollectionSlug;
        /**
         * Value can be just the document ID, or the full, populated document
         */
        value: DataFromCollectionSlug<TCollectionSlug> | number | string;
    };
}[CollectionSlug];
/**
 * Internal use only - UploadData type that can contain a pending state
 * @internal
 */
export type Internal_UploadData<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
    pending?: {
        /**
         * ID that corresponds to the bulk upload form ID
         */
        formID: string;
        /**
         * src value of the image dom element
         */
        src: string;
    };
} & UploadData<TUploadExtraFieldsData>;
/**
 * UploadDataImproved is a more precise type, and will replace UploadData in Payload v4.
 * This type is for internal use only as it will be deprecated in the future.
 * @internal
 *
 * @todo Replace UploadData with UploadDataImproved in 4.0
 */
export type UploadDataImproved<TUploadExtraFieldsData extends JsonObject = JsonObject> = {
    [TCollectionSlug in UploadCollectionSlug]: {
        fields: TUploadExtraFieldsData;
        /**
         * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
         */
        id: string;
        relationTo: TCollectionSlug;
        /**
         * Value can be just the document ID, or the full, populated document
         */
        value: number | string | TypedUploadCollection[TCollectionSlug];
    };
}[UploadCollectionSlug];
export type SerializedUploadNode = StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'upload'> & UploadData;
export declare class UploadServerNode extends DecoratorBlockNode {
    __data: UploadData;
    constructor({ data, format, key, }: {
        data: UploadData;
        format?: ElementFormatType;
        key?: NodeKey;
    });
    static clone(node: UploadServerNode): UploadServerNode;
    static getType(): string;
    static importDOM(): DOMConversionMap<HTMLImageElement>;
    static importJSON(serializedNode: SerializedUploadNode): UploadServerNode;
    static isInline(): false;
    createDOM(config?: EditorConfig): HTMLElement;
    decorate(): JSX.Element;
    exportDOM(): DOMExportOutput;
    exportJSON(): SerializedUploadNode;
    getData(): UploadData;
    setData(data: UploadData): void;
    updateDOM(): false;
}
export declare function $createUploadServerNode({ data, }: {
    data: Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>;
}): UploadServerNode;
export declare function $isUploadServerNode(node: LexicalNode | null | undefined): node is UploadServerNode;
//# sourceMappingURL=UploadNode.d.ts.map