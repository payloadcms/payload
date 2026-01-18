import type { SerializedListItemNode as _SerializedListItemNode, SerializedListNode as _SerializedListNode } from '@lexical/list';
import type { SerializedLexicalNode } from 'lexical';
import type { StronglyTypedElementNode } from '../../../nodeTypes.js';
import type { PluginComponent } from '../../typesClient.js';
export type SerializedListItemNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
    checked?: boolean;
} & StronglyTypedElementNode<_SerializedListItemNode, 'listitem', T>;
export type SerializedListNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
    checked?: boolean;
} & StronglyTypedElementNode<_SerializedListNode, 'list', T>;
export declare const LexicalListPlugin: PluginComponent<undefined>;
//# sourceMappingURL=index.d.ts.map