import type { SlateNodeConverter } from './converter/types.js';
export type SlateToLexicalFeatureProps = {
    /**
     * Custom converters to transform Slate nodes to Lexical nodes.
     * Can be an array of converters or a function that receives default converters and returns an array.
     * @default defaultSlateConverters
     */
    converters?: (({ defaultConverters }: {
        defaultConverters: SlateNodeConverter[];
    }) => SlateNodeConverter[]) | SlateNodeConverter[];
    /**
     * When true, disables the afterRead hook that converts Slate data on-the-fly.
     * Set this to true when running the migration script. That way, this feature is only used
     * to "pass through" the converters to the migration script.
     * @default false
     */
    disableHooks?: boolean;
};
/**
 * Enables on-the-fly conversion of Slate data to Lexical format through an afterRead hook.
 * Used for testing migrations before running the permanent migration script.
 * Only converts data that is in Slate format (arrays); Lexical data passes through unchanged.
 *
 * @example
 * ```ts
 * lexicalEditor({
 *   features: ({ defaultFeatures }) => [
 *     ...defaultFeatures,
 *     SlateToLexicalFeature({
 *       converters: [...defaultSlateConverters, MyCustomConverter],
 *       disableHooks: false, // Set to true during migration script
 *     }),
 *   ],
 * })
 * ```
 */
export declare const SlateToLexicalFeature: import("../../typesServer.js").FeatureProviderProviderServer<SlateToLexicalFeatureProps, {
    converters?: SlateNodeConverter[];
}, undefined>;
//# sourceMappingURL=feature.server.d.ts.map