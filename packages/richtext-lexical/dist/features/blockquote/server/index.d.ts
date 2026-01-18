import type { SerializedQuoteNode as _SerializedQuoteNode } from '@lexical/rich-text';
import type { SerializedLexicalNode } from 'lexical';
import type { StronglyTypedElementNode } from '../../../nodeTypes.js';
export type SerializedQuoteNode<T extends SerializedLexicalNode = SerializedLexicalNode> = StronglyTypedElementNode<_SerializedQuoteNode, 'quote', T>;
export declare const BlockquoteFeature: import("../../typesServer.js").FeatureProviderProviderServer<undefined, undefined, null>;
//# sourceMappingURL=index.d.ts.map