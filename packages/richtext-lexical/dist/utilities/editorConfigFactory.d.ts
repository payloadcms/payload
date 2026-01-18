import type { EditorConfig as LexicalEditorConfig } from 'lexical';
import type { RichTextField, SanitizedConfig } from 'payload';
import type { FeatureProviderServer, ResolvedServerFeatureMap } from '../features/typesServer.js';
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js';
import type { FeaturesInput, LexicalRichTextAdapterProvider } from '../types.js';
export declare const editorConfigFactory: {
    default: (args: {
        config: SanitizedConfig;
        parentIsLocalized?: boolean;
    }) => Promise<SanitizedServerEditorConfig>;
    /**
     * If you have instantiated a lexical editor and are accessing it outside a field (=> this is the unsanitized editor),
     * you can extract the editor config from it.
     * This is common if you define the editor in a re-usable module scope variable and pass it to the richText field.
     *
     * This is the least efficient way to get the editor config, and not recommended. It is recommended to extract the `features` arg
     * into a separate variable and use `fromFeatures` instead.
     */
    fromEditor: (args: {
        config: SanitizedConfig;
        editor: LexicalRichTextAdapterProvider;
        isRoot?: boolean;
        lexical?: LexicalEditorConfig;
        parentIsLocalized?: boolean;
    }) => Promise<SanitizedServerEditorConfig>;
    /**
     * Create a new editor config - behaves just like instantiating a new `lexicalEditor`
     */
    fromFeatures: (args: {
        config: SanitizedConfig;
        features?: FeaturesInput;
        isRoot?: boolean;
        lexical?: LexicalEditorConfig;
        parentIsLocalized?: boolean;
    }) => Promise<SanitizedServerEditorConfig>;
    fromField: (args: {
        field: RichTextField;
    }) => SanitizedServerEditorConfig;
    fromUnsanitizedField: (args: {
        config: SanitizedConfig;
        field: RichTextField;
        isRoot?: boolean;
        parentIsLocalized?: boolean;
    }) => Promise<SanitizedServerEditorConfig>;
};
export declare const featuresInputToEditorConfig: (args: {
    config: SanitizedConfig;
    features?: FeaturesInput;
    isRoot?: boolean;
    lexical?: LexicalEditorConfig;
    parentIsLocalized?: boolean;
}) => Promise<{
    features: FeatureProviderServer<unknown, unknown, unknown>[];
    resolvedFeatureMap: ResolvedServerFeatureMap;
    sanitizedConfig: SanitizedServerEditorConfig;
}>;
//# sourceMappingURL=editorConfigFactory.d.ts.map