import type { SerializedTableCellNode as _SerializedTableCellNode, SerializedTableNode as _SerializedTableNode, SerializedTableRowNode as _SerializedTableRowNode } from '@lexical/table';
import type { SerializedLexicalNode } from 'lexical';
import type { StronglyTypedElementNode } from '../../../nodeTypes.js';
export type SerializedTableCellNode<T extends SerializedLexicalNode = SerializedLexicalNode> = StronglyTypedElementNode<_SerializedTableCellNode, 'tablecell', T>;
export type SerializedTableNode<T extends SerializedLexicalNode = SerializedLexicalNode> = StronglyTypedElementNode<_SerializedTableNode, 'table', T>;
export type SerializedTableRowNode<T extends SerializedLexicalNode = SerializedLexicalNode> = StronglyTypedElementNode<_SerializedTableRowNode, 'tablerow', T>;
export declare const EXPERIMENTAL_TableFeature: import("../../typesServer.js").FeatureProviderProviderServer<undefined, undefined, undefined>;
//# sourceMappingURL=index.d.ts.map