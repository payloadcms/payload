import type { SerializedHeadingNode as _SerializedHeadingNode, HeadingTagType } from '@lexical/rich-text';
import type { SerializedLexicalNode } from 'lexical';
import type { StronglyTypedElementNode } from '../../../nodeTypes.js';
export type SerializedHeadingNode<T extends SerializedLexicalNode = SerializedLexicalNode> = StronglyTypedElementNode<_SerializedHeadingNode, 'heading', T>;
export type HeadingFeatureProps = {
    enabledHeadingSizes?: HeadingTagType[];
};
export declare const HeadingFeature: import("../../typesServer.js").FeatureProviderProviderServer<HeadingFeatureProps, HeadingFeatureProps, HeadingFeatureProps>;
//# sourceMappingURL=index.d.ts.map