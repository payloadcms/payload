import type { GenericLanguages, GenericTranslationsObject } from '@payloadcms/translations'

import { checkDependencies, deepMergeSimple } from 'payload'

import type { FeatureProviderServer, ResolvedServerFeatureMap } from './features/typesServer.js'
import type { SanitizedServerEditorConfig } from './lexical/config/types.js'
import type {
  AdapterProps,
  LexicalEditorProps,
  LexicalRichTextAdapterProvider,
} from './types/index.js'

import { getLexicalHooks } from './hooks.js'
import { i18n } from './i18n.js'
import { defaultEditorFeatures } from './lexical/config/server/default.js'
import { populateLexicalPopulationPromises } from './populateGraphQL/populateLexicalPopulationPromises.js'
import { getFieldToJSONSchema } from './types/schema.js'
import { featuresInputToEditorConfig } from './utilities/editorConfigFactory.js'
import { getGenerateImportMap } from './utilities/generateImportMap.js'
import { getGenerateSchemaMap } from './utilities/generateSchemaMap.js'
import { getDefaultSanitizedEditorConfig } from './utilities/getDefaultSanitizedEditorConfig.js'
import { richTextValidateHOC } from './validate/index.js'

let checkedDependencies = false

export const lexicalTargetVersion = '0.44.0'

export function lexicalEditor(args?: LexicalEditorProps): LexicalRichTextAdapterProvider {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
    !checkedDependencies
  ) {
    checkedDependencies = true
    void checkDependencies({
      dependencyGroups: [
        {
          name: 'lexical',
          dependencies: [
            'lexical',
            '@lexical/headless',
            '@lexical/link',
            '@lexical/list',
            '@lexical/mark',
            '@lexical/react',
            '@lexical/rich-text',
            '@lexical/selection',
            '@lexical/utils',
          ],
          targetVersion: lexicalTargetVersion,
        },
      ],
    })
  }
  return async ({ config, isRoot, parentIsLocalized }) => {
    let features: FeatureProviderServer<unknown, unknown, unknown>[] = []
    let resolvedFeatureMap: ResolvedServerFeatureMap

    let finalSanitizedEditorConfig: SanitizedServerEditorConfig // For server only
    if (!args || (!args.features && !args.lexical)) {
      finalSanitizedEditorConfig = await getDefaultSanitizedEditorConfig({
        config,
        parentIsLocalized,
      })

      features = defaultEditorFeatures

      resolvedFeatureMap = finalSanitizedEditorConfig.resolvedFeatureMap
    } else {
      const result = await featuresInputToEditorConfig({
        config,
        features: args?.features,
        isRoot,
        lexical: args?.lexical,
        parentIsLocalized,
      })
      finalSanitizedEditorConfig = result.sanitizedConfig
      features = result.features
      resolvedFeatureMap = result.resolvedFeatureMap
    }

    const featureI18n: Partial<GenericLanguages> = finalSanitizedEditorConfig.features.i18n
    const supportedLanguages = config.i18n?.supportedLanguages
    const supportedLanguagesToMerge: Partial<GenericLanguages> = {}
    for (const _lang in supportedLanguages) {
      if (!(_lang in i18n)) {
        if (featureI18n[_lang as keyof typeof i18n]) {
          supportedLanguagesToMerge[_lang as keyof typeof i18n] =
            featureI18n[_lang as keyof typeof i18n]
        }
        continue
      }
      const lang = _lang as keyof typeof i18n
      const lexicalI18nForLang = ((featureI18n[lang] ??= {}).lexical ??=
        {}) as GenericTranslationsObject

      lexicalI18nForLang.general = i18n[lang] ?? {}
      supportedLanguagesToMerge[lang] = featureI18n[lang]
    }

    config.i18n.translations = deepMergeSimple(config.i18n.translations, supportedLanguagesToMerge)

    return {
      CellComponent: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell',
      DiffComponent: '@payloadcms/richtext-lexical/rsc#LexicalDiffComponent',
      editorConfig: finalSanitizedEditorConfig,
      features,
      FieldComponent: {
        path: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField',
        serverProps: {
          admin: args?.admin,
          views: args?.views,
          // SanitizedEditorConfig is manually passed by `renderField` in `fieldSchemasToFormState/renderField.tsx`
          // in order to reduce the size of the field schema
        },
      },
      generateImportMap: getGenerateImportMap({
        lexicalEditorArgs: args,
        resolvedFeatureMap,
      }),
      generateSchemaMap: getGenerateSchemaMap({
        resolvedFeatureMap,
      }),
      graphQLPopulationPromises({
        context,
        currentDepth,
        depth,
        draft,
        field,
        fieldPromises,
        findMany,
        flattenLocales,
        overrideAccess,
        parentIsLocalized,
        populationPromises,
        req,
        showHiddenFields,
        siblingDoc,
      }) {
        // check if there are any features with nodes which have populationPromises for this field
        if (finalSanitizedEditorConfig?.features?.graphQLPopulationPromises?.size) {
          populateLexicalPopulationPromises({
            context,
            currentDepth: currentDepth ?? 0,
            depth,
            draft,
            editorPopulationPromises: finalSanitizedEditorConfig.features.graphQLPopulationPromises,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            overrideAccess,
            parentIsLocalized,
            populationPromises,
            req,
            showHiddenFields,
            siblingDoc,
          })
        }
      },
      hooks: getLexicalHooks({
        editorConfig: finalSanitizedEditorConfig,
      }),
      jsonSchema: getFieldToJSONSchema({ editorConfig: finalSanitizedEditorConfig }),
      validate: richTextValidateHOC({
        editorConfig: finalSanitizedEditorConfig,
      }),
    }
  }
}

export { AlignFeature } from './features/align/server/index.js'
export { BlockquoteFeature } from './features/blockquote/server/index.js'
export { CodeBlock } from './features/blocks/premade/CodeBlock/index.js'
export { BlocksFeature } from './features/blocks/server/index.js'
export type {
  BlocksFeatureProps,
  LexicalBlockClientProps,
  LexicalBlockLabelClientProps,
  LexicalBlockLabelServerProps,
  LexicalBlockServerProps,
  LexicalInlineBlockClientProps,
  LexicalInlineBlockLabelClientProps,
  LexicalInlineBlockLabelServerProps,
  LexicalInlineBlockServerProps,
} from './features/blocks/server/index.js'

export {
  $createServerBlockNode,
  $isServerBlockNode,
  ServerBlockNode,
} from './features/blocks/server/nodes/BlocksNode.js'
export {
  $createServerInlineBlockNode,
  $isServerInlineBlockNode,
  ServerInlineBlockNode,
} from './features/blocks/server/nodes/InlineBlocksNode.js'

export type { BlockFields, InlineBlockFields } from './features/blocks/server/schema.js'

export { convertHTMLToLexical } from './features/converters/htmlToLexical/index.js'

export { lexicalHTMLField } from './features/converters/lexicalToHtml/async/field/index.js'

export { convertLexicalToMarkdown } from './features/converters/lexicalToMarkdown/index.js'
export { convertMarkdownToLexical } from './features/converters/markdownToLexical/index.js'
export { getPayloadPopulateFn } from './features/converters/utilities/payloadPopulateFn.js'

export { getRestPopulateFn } from './features/converters/utilities/restPopulateFn.js'
export { DebugJsxConverterFeature } from './features/debug/jsxConverter/server/index.js'
export { TestRecorderFeature } from './features/debug/testRecorder/server/index.js'
export { TreeViewFeature } from './features/debug/treeView/server/index.js'
export { EXPERIMENTAL_TableFeature } from './features/experimental_table/server/index.js'
export { BoldFeature } from './features/format/bold/feature.server.js'
export { InlineCodeFeature } from './features/format/inlineCode/feature.server.js'

export { ItalicFeature } from './features/format/italic/feature.server.js'
export { StrikethroughFeature } from './features/format/strikethrough/feature.server.js'
export { SubscriptFeature } from './features/format/subscript/feature.server.js'
export { SuperscriptFeature } from './features/format/superscript/feature.server.js'
export { UnderlineFeature } from './features/format/underline/feature.server.js'
export { HeadingFeature, type HeadingFeatureProps } from './features/heading/server/index.js'
export { HorizontalRuleFeature } from './features/horizontalRule/server/index.js'

export { IndentFeature } from './features/indent/server/index.js'
export {
  $createAutoLinkNode,
  $isAutoLinkNode,
  AutoLinkNode,
} from './features/link/nodes/AutoLinkNode.js'
export { $createLinkNode, $isLinkNode, LinkNode } from './features/link/nodes/LinkNode.js'

export { LinkFeature, type LinkFeatureServerProps } from './features/link/server/index.js'
export type { LinkFields } from './features/link/server/schema.js'

export { ChecklistFeature } from './features/lists/checklist/server/index.js'
export { OrderedListFeature } from './features/lists/orderedList/server/index.js'

export { UnorderedListFeature } from './features/lists/unorderedList/server/index.js'

export { ParagraphFeature } from './features/paragraph/server/index.js'

export {
  RelationshipFeature,
  type RelationshipFeatureProps,
} from './features/relationship/server/index.js'

export { RelationshipServerNode } from './features/relationship/server/nodes/RelationshipNode.js'
export type { RelationshipData } from './features/relationship/server/schema.js'
export { defaultColors } from './features/textState/defaultColors.js'
export { TextStateFeature } from './features/textState/feature.server.js'

export { FixedToolbarFeature } from './features/toolbars/fixed/server/index.js'

export { InlineToolbarFeature } from './features/toolbars/inline/server/index.js'
export type { ToolbarGroup, ToolbarGroupItem } from './features/toolbars/types.js'
export type {
  BaseClientFeatureProps,
  ClientFeature,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  FeatureProviderProviderClient,
  PluginComponent,
  PluginComponentWithAnchor,
  ResolvedClientFeature,
  ResolvedClientFeatureMap,
  SanitizedClientFeatures,
  SanitizedPlugin,
} from './features/typesClient.js'

export type {
  AfterChangeNodeHook,
  AfterChangeNodeHookArgs,
  AfterReadNodeHook,
  AfterReadNodeHookArgs,
  BaseNodeHookArgs,
  BeforeChangeNodeHook,
  BeforeChangeNodeHookArgs,
  BeforeValidateNodeHook,
  BeforeValidateNodeHookArgs,
  FeatureProviderProviderServer,
  FeatureProviderServer,
  NodeValidation,
  NodeWithHooks,
  PopulationPromise,
  ResolvedServerFeature,
  ResolvedServerFeatureMap,
  SanitizedServerFeatures,
  ServerFeature,
  ServerFeatureProviderMap,
} from './features/typesServer.js'

export { createNode } from './features/typeUtilities.js' // Only useful in feature.server.ts

export { UploadFeature } from './features/upload/server/index.js'
export type { UploadFeatureProps } from './features/upload/server/index.js'

export { UploadServerNode } from './features/upload/server/nodes/UploadNode.js'
export type { UploadData } from './features/upload/server/schema.js'
export type { EditorConfigContextType } from './lexical/config/client/EditorConfigProvider.js'

export {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultEditorLexicalConfig,
} from './lexical/config/server/default.js'
export { loadFeatures, sortFeaturesForOptimalLoading } from './lexical/config/server/loader.js'

export {
  sanitizeServerEditorConfig,
  sanitizeServerFeatures,
} from './lexical/config/server/sanitize.js'
export type {
  ClientEditorConfig,
  SanitizedClientEditorConfig,
  SanitizedServerEditorConfig,
  ServerEditorConfig,
} from './lexical/config/types.js'
export type { AdapterProps }

export { getEnabledNodes, getEnabledNodesFromServerNodes } from './lexical/nodes/index.js'

export type {
  SlashMenuGroup,
  SlashMenuItem,
} from './lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
export {
  DETAIL_TYPE_TO_DETAIL,
  DOUBLE_LINE_BREAK,
  ELEMENT_FORMAT_TO_TYPE,
  ELEMENT_TYPE_TO_FORMAT,
  IS_ALL_FORMATTING,
  LTR_REGEX,
  NodeFormat,
  NON_BREAKING_SPACE,
  RTL_REGEX,
  TEXT_MODE_TO_TYPE,
  TEXT_TYPE_TO_FORMAT,
  TEXT_TYPE_TO_MODE,
} from './lexical/utils/nodeFormat.js'

export { sanitizeUrl, validateUrl } from './lexical/utils/url.js'

export { $convertFromMarkdownString } from './packages/@lexical/markdown/index.js'

export { defaultRichTextValue } from './populateGraphQL/defaultValue.js'
export { populate } from './populateGraphQL/populate.js'
export type {
  ClientFeaturesMap,
  LexicalEditorNodeMap,
  LexicalEditorProps,
  LexicalEditorViewMap,
  LexicalFieldAdminProps,
  LexicalRichTextAdapter,
  NodeMapValue,
  SerializedNodeBase,
  ViewMapBlockComponentProps,
} from './types/index.js'

export type * from './types/nodeTypes.js'

export { buildDefaultEditorState, buildEditorState } from './utilities/buildEditorState.js'
export { createServerFeature } from './utilities/createServerFeature.js'

export { editorConfigFactory } from './utilities/editorConfigFactory.js'
export type { FieldsDrawerProps } from './utilities/fieldsDrawer/Drawer.js'

export { extractPropsFromJSXPropsString } from './utilities/jsx/extractPropsFromJSXPropsString.js'

export {
  extractFrontmatter,
  frontmatterToObject,
  objectToFrontmatter,
  propsToJSXString,
} from './utilities/jsx/jsx.js'
export { upgradeLexicalData } from './utilities/upgradeLexicalData/index.js'
