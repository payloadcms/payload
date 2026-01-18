import type { EditorConfig as LexicalEditorConfig, SerializedEditorState } from 'lexical';
import type { ClientField, DefaultServerCellComponentProps, LabelFunction, RichTextAdapter, RichTextField, RichTextFieldClient, RichTextFieldClientProps, SanitizedConfig, ServerFieldBase, StaticLabel } from 'payload';
import type { BaseClientFeatureProps, FeatureProviderProviderClient } from './features/typesClient.js';
import type { FeatureProviderServer } from './features/typesServer.js';
import type { SanitizedServerEditorConfig } from './lexical/config/types.js';
import type { InitialLexicalFormState } from './utilities/buildInitialState.js';
export type LexicalFieldAdminProps = {
    /**
     * Controls if the add block button should be hidden. @default false
     */
    hideAddBlockButton?: boolean;
    /**
     * Controls if the draggable block element should be hidden. @default false
     */
    hideDraggableBlockElement?: boolean;
    /**
     * Controls if the gutter (padding to the left & gray vertical line) should be hidden. @default false
     */
    hideGutter?: boolean;
    /**
     * Controls if the insert paragraph at the end button should be hidden. @default false
     */
    hideInsertParagraphAtEnd?: boolean;
    /**
     * Changes the placeholder text in the editor if no content is present.
     */
    placeholder?: LabelFunction | StaticLabel;
};
export type LexicalFieldAdminClientProps = {
    placeholder?: string;
} & Omit<LexicalFieldAdminProps, 'placeholder'>;
export type FeaturesInput = (({ defaultFeatures, rootFeatures, }: {
    /**
     * This opinionated array contains all "recommended" default features.
     *
     * @Example
     *
     * ```ts
     *  editor: lexicalEditor({
     *    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
     *  })
     *  ```
     */
    defaultFeatures: FeatureProviderServer<any, any, any>[];
    /**
     * This array contains all features that are enabled in the root richText editor (the one defined in the payload.config.ts).
     * If this field is the root richText editor, or if the root richText editor is not a lexical editor, this array will be empty.
     *
     * @Example
     *
     * ```ts
     *  editor: lexicalEditor({
     *    features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
     *  })
     *  ```
     */
    rootFeatures: FeatureProviderServer<any, any, any>[];
}) => FeatureProviderServer<any, any, any>[]) | FeatureProviderServer<any, any, any>[];
export type LexicalEditorProps = {
    admin?: LexicalFieldAdminProps;
    features?: FeaturesInput;
    lexical?: LexicalEditorConfig;
};
export type LexicalRichTextAdapter = {
    editorConfig: SanitizedServerEditorConfig;
    features: FeatureProviderServer<any, any, any>[];
} & RichTextAdapter<SerializedEditorState, AdapterProps>;
export type LexicalRichTextAdapterProvider = 
/**
 * This is being called during the payload sanitization process
 */
({ config, isRoot, parentIsLocalized, }: {
    config: SanitizedConfig;
    isRoot?: boolean;
    parentIsLocalized: boolean;
}) => Promise<LexicalRichTextAdapter>;
export type SingleFeatureClientSchemaMap = {
    [key: string]: ClientField[];
};
export type FeatureClientSchemaMap = {
    [featureKey: string]: SingleFeatureClientSchemaMap;
};
export type LexicalRichTextFieldProps = {
    admin?: LexicalFieldAdminClientProps;
    clientFeatures: {
        [featureKey: string]: {
            clientFeatureProps?: BaseClientFeatureProps<Record<string, any>>;
            clientFeatureProvider?: FeatureProviderProviderClient<any, any>;
        };
    };
    /**
     * Part of the import map that contains client components for all lexical features of this field that
     * have been added through `feature.componentImports`.
     */
    featureClientImportMap?: Record<string, any>;
    featureClientSchemaMap: FeatureClientSchemaMap;
    initialLexicalFormState: InitialLexicalFormState;
    lexicalEditorConfig: LexicalEditorConfig | undefined;
} & Pick<ServerFieldBase, 'permissions'> & RichTextFieldClientProps<SerializedEditorState, AdapterProps, object>;
export type LexicalRichTextCellProps = DefaultServerCellComponentProps<RichTextFieldClient<SerializedEditorState, AdapterProps, object>, SerializedEditorState>;
export type AdapterProps = {
    editorConfig: SanitizedServerEditorConfig;
};
export type GeneratedFeatureProviderComponent = {
    clientFeature: FeatureProviderProviderClient<any, any>;
    clientFeatureProps: BaseClientFeatureProps<object>;
};
export type LexicalRichTextField = RichTextField<SerializedEditorState, AdapterProps>;
//# sourceMappingURL=types.d.ts.map