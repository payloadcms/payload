import type { JSONSchema4 } from 'json-schema'
import type { SerializedEditorState } from 'lexical'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'
import type { RichTextAdapter } from 'payload/types'

import { withNullableJSONSchemaType } from 'payload/utilities'

import type { FeatureProviderServer, ResolvedServerFeatureMap } from './field/features/types'
import type { SanitizedServerEditorConfig } from './field/lexical/config/types'
import type { AdapterProps } from './types'

import {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultSanitizedServerEditorConfig,
} from './field/lexical/config/server/default'
import { loadFeatures } from './field/lexical/config/server/loader'
import { sanitizeServerFeatures } from './field/lexical/config/server/sanitize'
import { cloneDeep } from './field/lexical/utils/cloneDeep'
import { getGenerateComponentMap } from './generateComponentMap'
import { getGenerateSchemaMap } from './generateSchemaMap'
import { richTextRelationshipPromise } from './populate/richTextRelationshipPromise'
import { richTextValidateHOC } from './validate'

export type LexicalEditorProps = {
  features?:
    | (({
        defaultFeatures,
      }: {
        defaultFeatures: FeatureProviderServer<unknown, unknown>[]
      }) => FeatureProviderServer<unknown, unknown>[])
    | FeatureProviderServer<unknown, unknown>[]
  lexical?: LexicalEditorConfig
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type LexicalRichTextAdapter = RichTextAdapter<SerializedEditorState, AdapterProps, any> & {
  editorConfig: SanitizedServerEditorConfig
}

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
    LazyCellComponent: () =>
      // @ts-expect-error
      import('./cell').then((module) => {
        const RichTextCell = module.RichTextCell
        return import('@payloadcms/ui').then((module2) =>
          module2.withMergedProps({
            Component: RichTextCell,
            toMergeIntoProps: { lexicalEditorConfig: props.lexical }, // lexicalEditorConfig is serializable
          }),
        )
      }),

    LazyFieldComponent: () =>
      // @ts-expect-error
      import('./field').then((module) => {
        const RichTextField = module.RichTextField
        return import('@payloadcms/ui').then((module2) =>
          module2.withMergedProps({
            Component: RichTextField,
            toMergeIntoProps: { lexicalEditorConfig: props.lexical }, // lexicalEditorConfig is serializable
          }),
        )
      }),
    afterReadPromise: ({ field, incomingEditorState, siblingDoc }) => {
      return new Promise<void>((resolve, reject) => {
        const promises: Promise<void>[] = []

        if (finalSanitizedEditorConfig?.features?.hooks?.afterReadPromises?.length) {
          for (const afterReadPromise of finalSanitizedEditorConfig.features.hooks
            .afterReadPromises) {
            const promise = afterReadPromise({
              field,
              incomingEditorState,
              siblingDoc,
            })
            if (promise) {
              promises.push(promise)
            }
          }
        }

        Promise.all(promises)
          .then(() => resolve())
          .catch((error) => reject(error))
      })
    },
    editorConfig: finalSanitizedEditorConfig,
    generateComponentMap: getGenerateComponentMap({
      resolvedFeatureMap,
    }),
    generateSchemaMap: getGenerateSchemaMap({
      resolvedFeatureMap,
    }),
    outputSchema: ({ field, interfaceNameDefinitions, isRequired }) => {
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
          currentSchema: outputSchema,
          field,
          interfaceNameDefinitions,
          isRequired,
        })
      }

      return outputSchema
    },
    populationPromise({
      context,
      currentDepth,
      depth,
      field,
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
        return richTextRelationshipPromise({
          context,
          currentDepth,
          depth,
          editorPopulationPromises: finalSanitizedEditorConfig.features.populationPromises,
          field,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }

      return null
    },
    validate: richTextValidateHOC({
      editorConfig: finalSanitizedEditorConfig,
    }),
  }
}

export { AlignFeature } from './field/features/align/feature.server'
export { BlockQuoteFeature } from './field/features/blockquote/feature.server'
export { BlocksFeature, type BlocksFeatureProps } from './field/features/blocks/feature.server'
export {
  $createBlockNode,
  $isBlockNode,
  type BlockFields,
  BlockNode,
  type SerializedBlockNode,
} from './field/features/blocks/nodes/BlocksNode'

export { TextDropdownSectionWithEntries } from './field/features/common/floatingSelectToolbarTextDropdownSection'
export {
  convertLexicalNodesToHTML,
  convertLexicalToHTML,
} from './field/features/converters/html/converter'
export { LinebreakHTMLConverter } from './field/features/converters/html/converter/converters/linebreak'

export { ParagraphHTMLConverter } from './field/features/converters/html/converter/converters/paragraph'
export { TextHTMLConverter } from './field/features/converters/html/converter/converters/text'
export { defaultHTMLConverters } from './field/features/converters/html/converter/defaultConverters'
export type { HTMLConverter } from './field/features/converters/html/converter/types'
export {
  HTMLConverterFeature,
  type HTMLConverterFeatureProps,
} from './field/features/converters/html/feature.server'
export { consolidateHTMLConverters } from './field/features/converters/html/field'
export { lexicalHTML } from './field/features/converters/html/field'
export { TestRecorderFeature } from './field/features/debug/testrecorder/feature.server'
export { TreeViewFeature } from './field/features/debug/treeview/feature.server'
export { BoldTextFeature } from './field/features/format/bold'
export { SectionWithEntries as FormatSectionWithEntries } from './field/features/format/common/floatingSelectToolbarSection'
export { InlineCodeTextFeature } from './field/features/format/inlinecode'
export { ItalicTextFeature } from './field/features/format/italic'
export { StrikethroughTextFeature } from './field/features/format/strikethrough'
export { SubscriptTextFeature } from './field/features/format/subscript'
export { SuperscriptTextFeature } from './field/features/format/superscript'
export { UnderlineTextFeature } from './field/features/format/underline'
export { HeadingFeature } from './field/features/heading'

export { IndentFeature } from './field/features/indent'
export { LinkFeature, type LinkFeatureServerProps } from './field/features/link/feature.server'

export {
  $createAutoLinkNode,
  $isAutoLinkNode,
  AutoLinkNode,
} from './field/features/link/nodes/AutoLinkNode'
export {
  $createLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from './field/features/link/nodes/LinkNode'
export type {
  LinkFields,
  SerializedAutoLinkNode,
  SerializedLinkNode,
} from './field/features/link/nodes/types'
export { CheckListFeature } from './field/features/lists/checklist'
export { OrderedListFeature } from './field/features/lists/orderedlist'
export { UnorderedListFeature } from './field/features/lists/unorderedlist'
export { LexicalPluginToLexicalFeature } from './field/features/migrations/lexicalPluginToLexical'
export { SlateToLexicalFeature } from './field/features/migrations/slateToLexical'
export { SlateBlockquoteConverter } from './field/features/migrations/slateToLexical/converter/converters/blockquote'
export { SlateHeadingConverter } from './field/features/migrations/slateToLexical/converter/converters/heading'
export { SlateIndentConverter } from './field/features/migrations/slateToLexical/converter/converters/indent'
export { SlateLinkConverter } from './field/features/migrations/slateToLexical/converter/converters/link'
export { SlateListItemConverter } from './field/features/migrations/slateToLexical/converter/converters/listItem'
export { SlateOrderedListConverter } from './field/features/migrations/slateToLexical/converter/converters/orderedList'
export { SlateRelationshipConverter } from './field/features/migrations/slateToLexical/converter/converters/relationship'
export { SlateUnknownConverter } from './field/features/migrations/slateToLexical/converter/converters/unknown'

export { SlateUnorderedListConverter } from './field/features/migrations/slateToLexical/converter/converters/unorderedList'
export { SlateUploadConverter } from './field/features/migrations/slateToLexical/converter/converters/upload'
export { defaultSlateConverters } from './field/features/migrations/slateToLexical/converter/defaultConverters'

export {
  convertSlateNodesToLexical,
  convertSlateToLexical,
} from './field/features/migrations/slateToLexical/converter/index'
export type {
  SlateNode,
  SlateNodeConverter,
} from './field/features/migrations/slateToLexical/converter/types'
export { ParagraphFeature } from './field/features/paragraph'
export { RelationshipFeature } from './field/features/relationship'
export {
  $createRelationshipNode,
  $isRelationshipNode,
  type RelationshipData,
  RelationshipNode,
  type SerializedRelationshipNode,
} from './field/features/relationship/nodes/RelationshipNode'
export type {
  ClientFeature,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  FeatureProviderProviderClient,
  FeatureProviderProviderServer,
  FeatureProviderServer,
  NodeValidation,
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
} from './field/features/types'
export { UploadFeature } from './field/features/upload'

export type { UploadFeatureProps } from './field/features/upload'

export type { RawUploadPayload } from './field/features/upload/nodes/UploadNode'

export {
  $createUploadNode,
  $isUploadNode,
  type SerializedUploadNode,
  type UploadData,
  UploadNode,
} from './field/features/upload/nodes/UploadNode'
export {
  EditorConfigProvider,
  useEditorConfigContext,
} from './field/lexical/config/client/EditorConfigProvider'
export {
  sanitizeClientEditorConfig,
  sanitizeClientFeatures,
} from './field/lexical/config/client/sanitize'
export {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultEditorLexicalConfig,
  defaultSanitizedServerEditorConfig,
} from './field/lexical/config/server/default'
export { loadFeatures, sortFeaturesForOptimalLoading } from './field/lexical/config/server/loader'
export {
  sanitizeServerEditorConfig,
  sanitizeServerFeatures,
} from './field/lexical/config/server/sanitize'

export type {
  ClientEditorConfig,
  SanitizedClientEditorConfig,
  SanitizedServerEditorConfig,
  ServerEditorConfig,
} from './field/lexical/config/types'
export { getEnabledNodes } from './field/lexical/nodes'

export {
  type FloatingToolbarSection,
  type FloatingToolbarSectionEntry,
} from './field/lexical/plugins/FloatingSelectToolbar/types'
export { ENABLE_SLASH_MENU_COMMAND } from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/index'
export type { AdapterProps }

export {
  SlashMenuGroup,
  SlashMenuOption,
} from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
export { CAN_USE_DOM } from './field/lexical/utils/canUseDOM'
export { cloneDeep } from './field/lexical/utils/cloneDeep'
export { getDOMRangeRect } from './field/lexical/utils/getDOMRangeRect'
export { getSelectedNode } from './field/lexical/utils/getSelectedNode'
export { isHTMLElement } from './field/lexical/utils/guard'
export { invariant } from './field/lexical/utils/invariant'
export { joinClasses } from './field/lexical/utils/joinClasses'
export { createBlockNode } from './field/lexical/utils/markdown/createBlockNode'
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
} from './field/lexical/utils/nodeFormat'
export { Point, isPoint } from './field/lexical/utils/point'
export { Rect } from './field/lexical/utils/rect'
export { setFloatingElemPosition } from './field/lexical/utils/setFloatingElemPosition'
export { setFloatingElemPositionForLinkEditor } from './field/lexical/utils/setFloatingElemPositionForLinkEditor'
export {
  addSwipeDownListener,
  addSwipeLeftListener,
  addSwipeRightListener,
  addSwipeUpListener,
} from './field/lexical/utils/swipe'
export { sanitizeUrl, validateUrl } from './field/lexical/utils/url'
export { defaultRichTextValue } from './populate/defaultValue'
