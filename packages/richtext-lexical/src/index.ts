import type { JSONSchema4 } from 'json-schema'
import type { SerializedEditorState } from 'lexical'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'
import type { RichTextAdapter } from 'payload/types'

import { withNullableJSONSchemaType } from 'payload/utilities'

import type { FeatureProvider } from './field/features/types'
import type { EditorConfig, SanitizedEditorConfig } from './field/lexical/config/types'
import type { AdapterProps } from './types'

import {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultSanitizedEditorConfig,
} from './field/lexical/config/default'
import { sanitizeEditorConfig } from './field/lexical/config/sanitize'
import { cloneDeep } from './field/lexical/utils/cloneDeep'
import { richTextRelationshipPromise } from './populate/richTextRelationshipPromise'
import { richTextValidateHOC } from './validate'

export type LexicalEditorProps = {
  features?:
    | (({ defaultFeatures }: { defaultFeatures: FeatureProvider[] }) => FeatureProvider[])
    | FeatureProvider[]
  lexical?: LexicalEditorConfig
}

export type LexicalRichTextAdapter = RichTextAdapter<SerializedEditorState, AdapterProps, any> & {
  editorConfig: SanitizedEditorConfig
}

export function lexicalEditor(props?: LexicalEditorProps): LexicalRichTextAdapter {
  let finalSanitizedEditorConfig: SanitizedEditorConfig
  if (!props || (!props.features && !props.lexical)) {
    finalSanitizedEditorConfig = cloneDeep(defaultSanitizedEditorConfig)
  } else {
    let features: FeatureProvider[] =
      props.features && typeof props.features === 'function'
        ? props.features({ defaultFeatures: cloneDeep(defaultEditorFeatures) })
        : (props.features as FeatureProvider[])
    if (!features) {
      features = cloneDeep(defaultEditorFeatures)
    }

    const lexical: LexicalEditorConfig = props.lexical

    finalSanitizedEditorConfig = sanitizeEditorConfig({
      features,
      lexical: props.lexical ? () => Promise.resolve(lexical) : defaultEditorConfig.lexical,
    })
  }

  return {
    LazyCellComponent: () =>
      // @ts-expect-error
      import('./cell').then((module) => {
        const RichTextCell = module.RichTextCell
        return import('payload/utilities').then((module2) =>
          module2.withMergedProps({
            Component: RichTextCell,
            toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
          }),
        )
      }),

    LazyFieldComponent: () =>
      // @ts-expect-error
      import('./field').then((module) => {
        const RichTextField = module.RichTextField
        return import('payload/utilities').then((module2) =>
          module2.withMergedProps({
            Component: RichTextField,
            toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
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
    outputSchema: ({
      collectionIDFieldTypes,
      config,
      field,
      interfaceNameDefinitions,
      isRequired,
      payload,
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
          payload,
        })
      }

      return outputSchema
    },
    populationPromise({
      context,
      currentDepth,
      depth,
      draft,
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
          draft,
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

export { BlockQuoteFeature } from './field/features/BlockQuote'
export { BlocksFeature, type BlocksFeatureProps } from './field/features/Blocks'
export {
  $createBlockNode,
  $isBlockNode,
  type BlockFields,
  BlockNode,
  type SerializedBlockNode,
} from './field/features/Blocks/nodes/BlocksNode'
export { HeadingFeature } from './field/features/Heading'

export { LinkFeature } from './field/features/Link'
export type { LinkFeatureProps } from './field/features/Link'
export {
  $createAutoLinkNode,
  $isAutoLinkNode,
  AutoLinkNode,
  type SerializedAutoLinkNode,
} from './field/features/Link/nodes/AutoLinkNode'
export {
  $createLinkNode,
  $isLinkNode,
  type LinkFields,
  LinkNode,
  type SerializedLinkNode,
  TOGGLE_LINK_COMMAND,
} from './field/features/Link/nodes/LinkNode'

export { ParagraphFeature } from './field/features/Paragraph'
export { RelationshipFeature } from './field/features/Relationship'

export {
  $createRelationshipNode,
  $isRelationshipNode,
  type RelationshipData,
  RelationshipNode,
  type SerializedRelationshipNode,
} from './field/features/Relationship/nodes/RelationshipNode'
export { UploadFeature } from './field/features/Upload'
export type { UploadFeatureProps } from './field/features/Upload'
export {
  $createUploadNode,
  $isUploadNode,
  RawUploadPayload,
  type SerializedUploadNode,
  type UploadData,
  UploadNode,
} from './field/features/Upload/nodes/UploadNode'
export { AlignFeature } from './field/features/align'
export { TextDropdownSectionWithEntries } from './field/features/common/floatingSelectToolbarTextDropdownSection'
export {
  HTMLConverterFeature,
  type HTMLConverterFeatureProps,
} from './field/features/converters/html'
export {
  convertLexicalNodesToHTML,
  convertLexicalToHTML,
} from './field/features/converters/html/converter'
export { LinebreakHTMLConverter } from './field/features/converters/html/converter/converters/linebreak'
export { ParagraphHTMLConverter } from './field/features/converters/html/converter/converters/paragraph'
export { TextHTMLConverter } from './field/features/converters/html/converter/converters/text'
export { defaultHTMLConverters } from './field/features/converters/html/converter/defaultConverters'
export type { HTMLConverter } from './field/features/converters/html/converter/types'
export { consolidateHTMLConverters } from './field/features/converters/html/field'
export { lexicalHTML } from './field/features/converters/html/field'
export { TestRecorderFeature } from './field/features/debug/TestRecorder'

export { TreeViewFeature } from './field/features/debug/TreeView'
export { BoldTextFeature } from './field/features/format/Bold'

export { InlineCodeTextFeature } from './field/features/format/InlineCode'
export { ItalicTextFeature } from './field/features/format/Italic'
export { SectionWithEntries as FormatSectionWithEntries } from './field/features/format/common/floatingSelectToolbarSection'
export { StrikethroughTextFeature } from './field/features/format/strikethrough'
export { SubscriptTextFeature } from './field/features/format/subscript'
export { SuperscriptTextFeature } from './field/features/format/superscript'
export { UnderlineTextFeature } from './field/features/format/underline'
export { HorizontalRuleFeature } from './field/features/horizontalrule'
export { IndentFeature } from './field/features/indent'
export { CheckListFeature } from './field/features/lists/CheckList'
export { OrderedListFeature } from './field/features/lists/OrderedList'
export { UnorderedListFeature } from './field/features/lists/UnorderedList'
export { LexicalPluginToLexicalFeature } from './field/features/migrations/LexicalPluginToLexical'
export { SlateToLexicalFeature } from './field/features/migrations/SlateToLexical'
export { SlateBlockquoteConverter } from './field/features/migrations/SlateToLexical/converter/converters/blockquote'

export { SlateHeadingConverter } from './field/features/migrations/SlateToLexical/converter/converters/heading'
export { SlateIndentConverter } from './field/features/migrations/SlateToLexical/converter/converters/indent'
export { SlateLinkConverter } from './field/features/migrations/SlateToLexical/converter/converters/link'

export { SlateListItemConverter } from './field/features/migrations/SlateToLexical/converter/converters/listItem'
export { SlateOrderedListConverter } from './field/features/migrations/SlateToLexical/converter/converters/orderedList'
export { SlateRelationshipConverter } from './field/features/migrations/SlateToLexical/converter/converters/relationship'
export { SlateUnknownConverter } from './field/features/migrations/SlateToLexical/converter/converters/unknown'
export { SlateUnorderedListConverter } from './field/features/migrations/SlateToLexical/converter/converters/unorderedList'
export { SlateUploadConverter } from './field/features/migrations/SlateToLexical/converter/converters/upload'
export { defaultSlateConverters } from './field/features/migrations/SlateToLexical/converter/defaultConverters'

export {
  convertSlateNodesToLexical,
  convertSlateToLexical,
} from './field/features/migrations/SlateToLexical/converter/index'

export type {
  SlateNode,
  SlateNodeConverter,
} from './field/features/migrations/SlateToLexical/converter/types'

export type {
  Feature,
  FeatureProvider,
  FeatureProviderMap,
  NodeValidation,
  PopulationPromise,
  ResolvedFeature,
  ResolvedFeatureMap,
  SanitizedFeatures,
} from './field/features/types'
export {
  EditorConfigProvider,
  useEditorConfigContext,
} from './field/lexical/config/EditorConfigProvider'
export {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultSanitizedEditorConfig,
} from './field/lexical/config/default'
export { loadFeatures, sortFeaturesForOptimalLoading } from './field/lexical/config/loader'
export { sanitizeEditorConfig, sanitizeFeatures } from './field/lexical/config/sanitize'
export { getEnabledNodes } from './field/lexical/nodes'

export {
  type FloatingToolbarSection,
  type FloatingToolbarSectionEntry,
} from './field/lexical/plugins/FloatingSelectToolbar/types'
export { ENABLE_SLASH_MENU_COMMAND } from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/index'
// export SanitizedEditorConfig
export type { EditorConfig, SanitizedEditorConfig }
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
