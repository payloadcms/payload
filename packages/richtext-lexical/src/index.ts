import type { SerializedEditorState } from 'lexical'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'
import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/utilities'

import type { FeatureProvider } from './field/features/types'
import type { EditorConfig, SanitizedEditorConfig } from './field/lexical/config/types'
import type { AdapterProps } from './types'

import { RichTextCell } from './cell'
import { RichTextField } from './field'
import {
  defaultEditorFeatures,
  defaultEditorLexicalConfig,
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

export function lexicalEditor(
  props?: LexicalEditorProps,
): RichTextAdapter<SerializedEditorState, AdapterProps> {
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

    const lexical: LexicalEditorConfig = props.lexical || cloneDeep(defaultEditorLexicalConfig)

    finalSanitizedEditorConfig = sanitizeEditorConfig({
      features,
      lexical,
    })
  }

  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: { editorConfig: finalSanitizedEditorConfig },
    }),
    afterReadPromise: ({ field, incomingEditorState, siblingDoc }) => {
      return new Promise<void>((resolve, reject) => {
        const promises: Promise<void>[] = []

        if (finalSanitizedEditorConfig?.features?.hooks?.afterReadPromises?.length) {
          for (const afterReadPromise of finalSanitizedEditorConfig.features.hooks
            .afterReadPromises) {
            promises.push(
              afterReadPromise({
                field,
                incomingEditorState,
                siblingDoc,
              }),
            )
          }
        }

        Promise.all(promises)
          .then(() => resolve())
          .catch((error) => reject(error))
      })
    },
    populationPromise({
      currentDepth,
      depth,
      field,
      overrideAccess,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      // check if there are any features with nodes which have afterReadPromises for this field
      if (finalSanitizedEditorConfig?.features?.populationPromises?.size) {
        return richTextRelationshipPromise({
          currentDepth,
          depth,
          field,
          overrideAccess,
          populationPromises: finalSanitizedEditorConfig.features.populationPromises,
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
export { BlocksFeature } from './field/features/Blocks'
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
export { HTMLConverterFeature } from './field/features/converters/html'
export { TreeviewFeature } from './field/features/debug/TreeView'

export { BoldTextFeature } from './field/features/format/Bold'
export { InlineCodeTextFeature } from './field/features/format/InlineCode'
export { ItalicTextFeature } from './field/features/format/Italic'
export { SectionWithEntries as FormatSectionWithEntries } from './field/features/format/common/floatingSelectToolbarSection'
export { StrikethroughTextFeature } from './field/features/format/strikethrough'
export { SubscriptTextFeature } from './field/features/format/subscript'
export { SuperscriptTextFeature } from './field/features/format/superscript'
export { UnderlineTextFeature } from './field/features/format/underline'
export { IndentFeature } from './field/features/indent'
export { CheckListFeature } from './field/features/lists/CheckList'
export { OrderedListFeature } from './field/features/lists/OrderedList'
export { UnoderedListFeature } from './field/features/lists/UnorderedList'
export { LexicalPluginToLexicalFeature } from './field/features/migrations/LexicalPluginToLexical'
export { SlateToLexicalFeature } from './field/features/migrations/SlateToLexical'

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
  defaultEditorLexicalConfig,
  defaultSanitizedEditorConfig,
} from './field/lexical/config/default'
export { loadFeatures, sortFeaturesForOptimalLoading } from './field/lexical/config/loader'
export { sanitizeEditorConfig, sanitizeFeatures } from './field/lexical/config/sanitize'
export { getEnabledNodes } from './field/lexical/nodes'

export { ToolbarButton } from './field/lexical/plugins/FloatingSelectToolbar/ToolbarButton'
export { ToolbarDropdown } from './field/lexical/plugins/FloatingSelectToolbar/ToolbarDropdown/index'
export {
  type FloatingToolbarSection,
  type FloatingToolbarSectionEntry,
} from './field/lexical/plugins/FloatingSelectToolbar/types'
export {
  SlashMenuGroup,
  SlashMenuOption,
} from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
// export SanitizedEditorConfig
export type { EditorConfig, SanitizedEditorConfig }
export type { AdapterProps }
export { RichTextCell }
export { RichTextField }
export { ENABLE_SLASH_MENU_COMMAND } from './field/lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/index'
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
