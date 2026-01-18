import type { DOMConversionMap, EditorConfig, LexicalEditor, LexicalNode } from 'lexical';
import type { JSX } from 'react';
import type { SerializedUploadNode, UploadData } from '../../server/nodes/UploadNode.js';
import { UploadServerNode } from '../../server/nodes/UploadNode.js';
export declare class UploadNode extends UploadServerNode {
    static clone(node: UploadServerNode): UploadServerNode;
    static getType(): string;
    static importDOM(): DOMConversionMap<HTMLImageElement>;
    static importJSON(serializedNode: SerializedUploadNode): UploadNode;
    decorate(editor?: LexicalEditor, config?: EditorConfig): JSX.Element;
    exportJSON(): SerializedUploadNode;
}
export declare function $createUploadNode({ data, }: {
    data: Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>;
}): UploadNode;
export declare function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode;
//# sourceMappingURL=UploadNode.d.ts.map