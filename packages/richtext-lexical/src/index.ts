import type { JSONSchema4 } from 'json-schema'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor.js'

import { withMergedProps } from '@payloadcms/ui/elements/withMergedProps'
import { withNullableJSONSchemaType } from 'payload/utilities'

import type { FeatureProviderServer, ResolvedServerFeatureMap } from './field/features/types.js'
import type { SanitizedServerEditorConfig } from './field/lexical/config/types.js'
import type { AdapterProps, LexicalEditorProps, LexicalRichTextAdapter } from './types.js'

import { RichTextCell } from './cell/index.js'
import { RichTextField } from './field/index.js'
import {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultSanitizedServerEditorConfig,
} from './field/lexical/config/server/default.js'
import { loadFeatures } from './field/lexical/config/server/loader.js'
import { sanitizeServerFeatures } from './field/lexical/config/server/sanitize.js'
import { cloneDeep } from './field/lexical/utils/cloneDeep.js'
import { getGenerateComponentMap } from './generateComponentMap.js'
import { getGenerateSchemaMap } from './generateSchemaMap.js'
import { populateLexicalPopulationPromises } from './populate/populateLexicalPopulationPromises.js'
import { richTextValidateHOC } from './validate/index.js'

export function lexicalEditor(props?: LexicalEditorProps): LexicalRichTextAdapter {
  let resolvedFeatureMap: ResolvedServerFeatureMap = null

  let finalSanitizedEditorConfig: SanitizedServerEditorConfig // For server only
  if (!props || (!props.features && !props.lexical)) {
    finalSanitizedEditorConfig = cloneDeep(defaultSanitizedServerEditorConfig)
    resolvedFeatureMap = finalSanitizedEditorConfig.resolvedFeatureMap
  } else {
    let features: FeatureProviderServer<unknown, unknown>[] =
      props.features && typeof props.features === 'function'
        ? props.features({ defaultFeatures: cloneDeep(defaultEditorFeatures) })
        : (props.features as FeatureProviderServer<unknown, unknown>[])
    if (!features) {
      features = cloneDeep(defaultEditorFeatures)
    }

    const lexical: LexicalEditorConfig = props.lexical

    resolvedFeatureMap = loadFeatures({
      unSanitizedEditorConfig: {
        features,
        lexical: lexical ? lexical : defaultEditorConfig.lexical,
      },
    })

    finalSanitizedEditorConfig = {
      features: sanitizeServerFeatures(resolvedFeatureMap),
      lexical: lexical ? lexical : defaultEditorConfig.lexical,
      resolvedFeatureMap,
    }
  }

  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: { lexicalEditorConfig: finalSanitizedEditorConfig.lexical },
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: { lexicalEditorConfig: finalSanitizedEditorConfig.lexical },
    }),
    editorConfig: finalSanitizedEditorConfig,
    generateComponentMap: getGenerateComponentMap({
      resolvedFeatureMap,
    }),
    generateSchemaMap: getGenerateSchemaMap({
      resolvedFeatureMap,
    }),
    /* hooks: {
      afterChange: finalSanitizedEditorConfig.features.hooks.afterChange,
      afterRead: finalSanitizedEditorConfig.features.hooks.afterRead,
      beforeChange: finalSanitizedEditorConfig.features.hooks.beforeChange,
      beforeDuplicate: finalSanitizedEditorConfig.features.hooks.beforeDuplicate,
      beforeValidate: finalSanitizedEditorConfig.features.hooks.beforeValidate,
    },*/
    outputSchema: ({
      collectionIDFieldTypes,
      config,
      field,
      interfaceNameDefinitions,
      isRequired,
    }) => {
      let outputSchema: JSONSchema4 = {
        // This schema matches the SerializedEditorState type so far, that it's possible to cast SerializedEditorState to this schema without any errors.
        // In the future, we should
        // 1) allow recursive children
        // 2) Pass in all the different types for every node added to the editorconfig. This can be done with refs in the schema.
        type: withNullableJSONSchemaType('object', isRequired),
        properties: {
          root: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: {
                type: 'string',
              },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    type: {
                      type: 'string',
                    },
                    version: {
                      type: 'integer',
                    },
                  },
                  required: ['type', 'version'],
                },
              },
              direction: {
                oneOf: [
                  {
                    enum: ['ltr', 'rtl'],
                  },
                  {
                    type: 'null',
                  },
                ],
              },
              format: {
                type: 'string',
                enum: ['left', 'start', 'center', 'right', 'end', 'justify', ''], // ElementFormatType, since the root node is an element
              },
              indent: {
                type: 'integer',
              },
              version: {
                type: 'integer',
              },
            },
            required: ['children', 'direction', 'format', 'indent', 'type', 'version'],
          },
        },
        required: ['root'],
      }
      for (const modifyOutputSchema of finalSanitizedEditorConfig.features.generatedTypes
        .modifyOutputSchemas) {
        outputSchema = modifyOutputSchema({
          collectionIDFieldTypes,
          config,
          currentSchema: outputSchema,
          field,
          interfaceNameDefinitions,
          isRequired,
        })
      }

      return outputSchema
    },
    populationPromises({
      context,
      currentDepth,
      depth,
      field,
      fieldPromises,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      // check if there are any features with nodes which have populationPromises for this field
      if (finalSanitizedEditorConfig?.features?.populationPromises?.size) {
        populateLexicalPopulationPromises({
          context,
          currentDepth,
          depth,
          editorPopulationPromises: finalSanitizedEditorConfig.features.populationPromises,
          field,
          fieldPromises,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }
    },
    validate: richTextValidateHOC({
      editorConfig: finalSanitizedEditorConfig,
    }),
  }
}

export { AlignFeature } from './field/features/align/feature.server.js'
export { BlockQuoteFeature } from './field/features/blockquote/feature.server.js'
export {
  BlocksFeature,
  type BlocksFeatureProps,
  type LexicalBlock,
} from './field/features/blocks/feature.server.js'
export {
  $createBlockNode,
  $isBlockNode,
  type BlockFields,
  BlockNode,
  type SerializedBlockNode,
} from './field/features/blocks/nodes/BlocksNode.js'

export { TextDropdownSectionWithEntries } from './field/features/common/floatingSelectToolbarTextDropdownSection/index.js'
export { LinebreakHTMLConverter } from './field/features/converters/html/converter/converters/linebreak.js'
export { ParagraphHTMLConverter } from './field/features/converters/html/converter/converters/paragraph.js'

export { TextHTMLConverter } from './field/features/converters/html/converter/converters/text.js'
export { defaultHTMLConverters } from './field/features/converters/html/converter/defaultConverters.js'
export {
  convertLexicalNodesToHTML,
  convertLexicalToHTML,
} from './field/features/converters/html/converter/index.js'
export type { HTMLConverter } from './field/features/converters/html/converter/types.js'
export {
  HTMLConverterFeature,
  type HTMLConverterFeatureProps,
} from './field/features/converters/html/feature.server.js'
export {
  consolidateHTMLConverters,
  lexicalHTML,
} from './field/features/converters/html/field/index.js'
export { createClientComponent } from './field/features/createClientComponent.js'
export { TestRecorderFeature } from './field/features/debug/testrecorder/feature.server.js'
export { TreeViewFeature } from './field/features/debug/treeview/feature.server.js'
export { BoldFeature } from './field/features/format/bold/feature.server.js'
export { SectionWithEntries as FormatSectionWithEntries } from './field/features/format/common/floatingSelectToolbarSection.js'
export { InlineCodeFeature } from './field/features/format/inlinecode/feature.server.js'
export { ItalicFeature } from './field/features/format/italic/feature.server.js'
export { StrikethroughFeature } from './field/features/format/strikethrough/feature.server.js'
export { SubscriptFeature } from './field/features/format/subscript/feature.server.js'
export { SuperscriptFeature } from './field/features/format/superscript/feature.server.js'
export { UnderlineFeature } from './field/features/format/underline/feature.server.js'

export { HeadingFeature } from './field/features/heading/feature.server.js'
export { IndentFeature } from './field/features/indent/feature.server.js'

export { LinkFeature, type LinkFeatureServerProps } from './field/features/link/feature.server.js'
export {
  $createAutoLinkNode,
  $isAutoLinkNode,
  AutoLinkNode,
} from './field/features/link/nodes/AutoLinkNode.js'
export {
  $createLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from './field/features/link/nodes/LinkNode.js'
export type {
  LinkFields,
  SerializedAutoLinkNode,
  SerializedLinkNode,
} from './field/features/link/nodes/types.js'
export { CheckListFeature } from './field/features/lists/checklist/feature.server.js'
export { OrderedListFeature } from './field/features/lists/orderedlist/feature.server.js'
export { UnorderedListFeature } from './field/features/lists/unorderedlist/feature.server.js'
export { LexicalPluginToLexicalFeature } from './field/features/migrations/lexicalPluginToLexical/feature.server.js'
export { SlateBlockquoteConverter } from './field/features/migrations/slateToLexical/converter/converters/blockquote/index.js'
export { SlateHeadingConverter } from './field/features/migrations/slateToLexical/converter/converters/heading/index.js'
export { SlateIndentConverter } from './field/features/migrations/slateToLexical/converter/converters/indent/index.js'
export { SlateLinkConverter } from './field/features/migrations/slateToLexical/converter/converters/link/index.js'
export { SlateListItemConverter } from './field/features/migrations/slateToLexical/converter/converters/listItem/index.js'
export { SlateOrderedListConverter } from './field/features/migrations/slateToLexical/converter/converters/orderedList/index.js'
export { SlateRelationshipConverter } from './field/features/migrations/slateToLexical/converter/converters/relationship/index.js'
export { SlateUnknownConverter } from './field/features/migrations/slateToLexical/converter/converters/unknown/index.js'
export { SlateUnorderedListConverter } from './field/features/migrations/slateToLexical/converter/converters/unorderedList/index.js'

export { SlateUploadConverter } from './field/features/migrations/slateToLexical/converter/converters/upload/index.js'
export { defaultSlateConverters } from './field/features/migrations/slateToLexical/converter/defaultConverters.js'
export {
  convertSlateNodesToLexical,
  convertSlateToLexical,
} from './field/features/migrations/slateToLexical/converter/index.js'

export type {
  SlateNode,
  SlateNodeConverter,
} from './field/features/migrations/slateToLexical/converter/types.js'
export { SlateToLexicalFeature } from './field/features/migrations/slateToLexical/feature.server.js'
export { ParagraphFeature } from './field/features/paragraph/feature.server.js'
export { RelationshipFeature } from './field/features/relationship/feature.server.js'
export {
  $createRelationshipNode,
  $isRelationshipNode,
  type RelationshipData,
  RelationshipNode,
  type SerializedRelationshipNode,
} from './field/features/relationship/nodes/RelationshipNode.js'
export { createNode } from './field/features/typeUtilities.js'
export type {
  ClientComponentProps,
  ClientFeature,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  FeatureProviderProviderClient,
  FeatureProviderProviderServer,
  FeatureProviderServer,
  FieldNodeHook,
  FieldNodeHookArgs,
  NodeValidation,
  NodeWithHooks,
  PopulationPromise,
  ResolvedClientFeature,
  ResolvedClientFeatureMap,
  ResolvedServerFeature,
  ResolvedServerFeatureMap,
  SanitizedClientFeatures,
  SanitizedPlugin,
  SanitizedServerFeatures,
  ServerFeature,
  ServerFeatureProviderMap,
} from './field/features/types.js'
export { UploadFeature } from './field/features/upload/feature.server.js'

export type { UploadFeatureProps } from './field/features/upload/feature.server.js'

export {
  $createUploadNode,
  $isUploadNode,
  type SerializedUploadNode,
  type UploadData,
  UploadNode,
} from './field/features/upload/nodes/UploadNode.js'
export {
  EditorConfigProvider,
  useEditorConfigContext,
} from './field/lexical/config/client/EditorConfigProvider.js'
export {
  sanitizeClientEditorConfig,
  sanitizeClientFeatures,
} from './field/lexical/config/client/sanitize.js'
export {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultEditorLexicalConfig,
  defaultSanitizedServerEditorConfig,
} from './field/lexical/config/server/default.js'
export {
  loadFeatures,
  sortFeaturesForOptimalLoading,
} from './field/lexical/config/server/loader.js'
export {
  sanitizeServerEditorConfig,
  sanitizeServerFeatures,
} from './field/lexical/config/server/sanitize.js'

export type {
  ClientEditorConfig,
  SanitizedClientEditorConfig,
  SanitizedServerEditorConfig,
  ServerEditorConfig,
} from './field/lexical/config/types.js'
export { getEnabledNodes } from './field/lexical/nodes/index.js'

export {
  type FloatingToolbarSection,
  type FloatingToolbarSectionEntry,
} from './field/lexical/plugins/FloatingSelectToolbar/types.js'
export { ENABLE_SLASH_MENU_COMMAND } from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/index.js'
export type { AdapterProps }

export {
  SlashMenuGroup,
  SlashMenuOption,
} from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
export { CAN_USE_DOM } from './field/lexical/utils/canUseDOM.js'
export { cloneDeep } from './field/lexical/utils/cloneDeep.js'
export { getDOMRangeRect } from './field/lexical/utils/getDOMRangeRect.js'
export { getSelectedNode } from './field/lexical/utils/getSelectedNode.js'
export { isHTMLElement } from './field/lexical/utils/guard.js'
export { invariant } from './field/lexical/utils/invariant.js'
export { joinClasses } from './field/lexical/utils/joinClasses.js'
export { createBlockNode } from './field/lexical/utils/markdown/createBlockNode.js'
export {
  DETAIL_TYPE_TO_DETAIL,
  DOUBLE_LINE_BREAK,
  ELEMENT_FORMAT_TO_TYPE,
  ELEMENT_TYPE_TO_FORMAT,
  IS_ALL_FORMATTING,
  LTR_REGEX,
  NON_BREAKING_SPACE,
  NodeFormat,
  RTL_REGEX,
  TEXT_MODE_TO_TYPE,
  TEXT_TYPE_TO_FORMAT,
  TEXT_TYPE_TO_MODE,
} from './field/lexical/utils/nodeFormat.js'
export { Point, isPoint } from './field/lexical/utils/point.js'
export { Rect } from './field/lexical/utils/rect.js'
export { setFloatingElemPosition } from './field/lexical/utils/setFloatingElemPosition.js'
export { setFloatingElemPositionForLinkEditor } from './field/lexical/utils/setFloatingElemPositionForLinkEditor.js'
export {
  addSwipeDownListener,
  addSwipeLeftListener,
  addSwipeRightListener,
  addSwipeUpListener,
} from './field/lexical/utils/swipe.js'
export { sanitizeUrl, validateUrl } from './field/lexical/utils/url.js'
export { defaultRichTextValue } from './populate/defaultValue.js'

export type { LexicalEditorProps, LexicalRichTextAdapter } from './types.js'
