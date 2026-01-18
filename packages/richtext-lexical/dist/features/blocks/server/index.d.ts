import type { Block, BlockSlug, UIFieldClientProps, UIFieldServerProps } from 'payload';
export type BlocksFeatureProps = {
    blocks?: (Block | BlockSlug)[] | Block[];
    inlineBlocks?: (Block | BlockSlug)[] | Block[];
};
export declare const BlocksFeature: import("../../typesServer.js").FeatureProviderProviderServer<BlocksFeatureProps, BlocksFeatureProps, undefined>;
/**
 * Props for the client components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockClientProps = UIFieldClientProps;
/**
 * Props for the server components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockServerProps = UIFieldServerProps;
/**
 * Props for the client components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelClientProps = UIFieldClientProps;
/**
 * Props for the server components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelServerProps = UIFieldServerProps;
/**
 * Props for the client components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockClientProps = UIFieldClientProps;
/**
 * Props for the server components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockServerProps = UIFieldServerProps;
/**
 * Props for the client components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelClientProps = UIFieldClientProps;
/**
 * Props for the server components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelServerProps = UIFieldServerProps;
//# sourceMappingURL=index.d.ts.map