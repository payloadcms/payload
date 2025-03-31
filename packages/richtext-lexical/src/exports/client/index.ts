/* eslint-disable perfectionist/sort-exports */
'use client'

export { slashMenuBasicGroupWithItems } from '../../features/shared/slashMenu/basicGroup.js'

export { AlignFeatureClient } from '../../features/align/client/index.js'
export { BlockquoteFeatureClient } from '../../features/blockquote/client/index.js'
export { BlocksFeatureClient } from '../../features/blocks/client/index.js'
export {
  INSERT_BLOCK_COMMAND,
  INSERT_INLINE_BLOCK_COMMAND,
} from '../../features/blocks/client/plugin/commands.js'

export { TestRecorderFeatureClient } from '../../features/debug/testRecorder/client/index.js'
export { TreeViewFeatureClient } from '../../features/debug/treeView/client/index.js'
export { BoldFeatureClient } from '../../features/format/bold/feature.client.js'
export { InlineCodeFeatureClient } from '../../features/format/inlineCode/feature.client.js'
export { ItalicFeatureClient } from '../../features/format/italic/feature.client.js'
export { StrikethroughFeatureClient } from '../../features/format/strikethrough/feature.client.js'
export { SubscriptFeatureClient } from '../../features/format/subscript/feature.client.js'
export { SuperscriptFeatureClient } from '../../features/format/superscript/feature.client.js'
export { UnderlineFeatureClient } from '../../features/format/underline/feature.client.js'
export { HeadingFeatureClient } from '../../features/heading/client/index.js'
export { HorizontalRuleFeatureClient } from '../../features/horizontalRule/client/index.js'
export { IndentFeatureClient } from '../../features/indent/client/index.js'
export { LinkFeatureClient } from '../../features/link/client/index.js'
export { ChecklistFeatureClient } from '../../features/lists/checklist/client/index.js'
export { OrderedListFeatureClient } from '../../features/lists/orderedList/client/index.js'
export { UnorderedListFeatureClient } from '../../features/lists/unorderedList/client/index.js'
export { LexicalPluginToLexicalFeatureClient } from '../../features/migrations/lexicalPluginToLexical/feature.client.js'
export { SlateToLexicalFeatureClient } from '../../features/migrations/slateToLexical/feature.client.js'
export { ParagraphFeatureClient } from '../../features/paragraph/client/index.js'

export { RelationshipFeatureClient } from '../../features/relationship/client/index.js'

export { toolbarFormatGroupWithItems } from '../../features/format/shared/toolbarFormatGroup.js'
export { toolbarAddDropdownGroupWithItems } from '../../features/shared/toolbar/addDropdownGroup.js'
export { toolbarFeatureButtonsGroupWithItems } from '../../features/shared/toolbar/featureButtonsGroup.js'
export { toolbarTextDropdownGroupWithItems } from '../../features/shared/toolbar/textDropdownGroup.js'
export { FixedToolbarFeatureClient } from '../../features/toolbars/fixed/client/index.js'
export { InlineToolbarFeatureClient } from '../../features/toolbars/inline/client/index.js'
export { ToolbarButton } from '../../features/toolbars/shared/ToolbarButton/index.js'
export { TableFeatureClient } from '../../features/experimental_table/client/index.js'

export { ToolbarDropdown } from '../../features/toolbars/shared/ToolbarDropdown/index.js'
export { UploadFeatureClient } from '../../features/upload/client/index.js'

export { RichTextField } from '../../field/index.js'
export {
  EditorConfigProvider,
  useEditorConfigContext,
} from '../../lexical/config/client/EditorConfigProvider.js'
export { defaultEditorLexicalConfig } from '../../lexical/config/client/default.js'

export {
  sanitizeClientEditorConfig,
  sanitizeClientFeatures,
} from '../../lexical/config/client/sanitize.js'
export { CAN_USE_DOM } from '../../lexical/utils/canUseDOM.js'
export { getDOMRangeRect } from '../../lexical/utils/getDOMRangeRect.js'
export { getSelectedNode } from '../../lexical/utils/getSelectedNode.js'
export { isHTMLElement } from '../../lexical/utils/guard.js'
export { joinClasses } from '../../lexical/utils/joinClasses.js'

export { createBlockNode } from '../../lexical/utils/markdown/createBlockNode.js'
export { isPoint, Point } from '../../lexical/utils/point.js'
export { Rect } from '../../lexical/utils/rect.js'
export { setFloatingElemPosition } from '../../lexical/utils/setFloatingElemPosition.js'
export { setFloatingElemPositionForLinkEditor } from '../../lexical/utils/setFloatingElemPositionForLinkEditor.js'

export {
  addSwipeDownListener,
  addSwipeLeftListener,
  addSwipeRightListener,
  addSwipeUpListener,
} from '../../lexical/utils/swipe.js'
export { createClientFeature } from '../../utilities/createClientFeature.js'

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
} from '../../lexical/utils/nodeFormat.js'

export { ENABLE_SLASH_MENU_COMMAND } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/index.js'

export { getEnabledNodes } from '../../lexical/nodes/index.js'

export {
  $createUploadNode,
  $isUploadNode,
  UploadNode,
} from '../../features/upload/client/nodes/UploadNode.js'

export {
  $createRelationshipNode,
  $isRelationshipNode,
  RelationshipNode,
} from '../../features/relationship/client/nodes/RelationshipNode.js'

export {
  $createLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from '../../features/link/nodes/LinkNode.js'

export {
  $createAutoLinkNode,
  $isAutoLinkNode,
  AutoLinkNode,
} from '../../features/link/nodes/AutoLinkNode.js'

export {
  $createBlockNode,
  $isBlockNode,
  BlockNode,
} from '../../features/blocks/client/nodes/BlocksNode.js'

export {
  $createInlineBlockNode,
  $isInlineBlockNode,
  InlineBlockNode,
} from '../../features/blocks/client/nodes/InlineBlocksNode.js'

export { FieldsDrawer } from '../../utilities/fieldsDrawer/Drawer.js'
export { useLexicalDocumentDrawer } from '../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js'
export { useLexicalDrawer } from '../../utilities/fieldsDrawer/useLexicalDrawer.js'
export { useLexicalListDrawer } from '../../utilities/fieldsDrawer/useLexicalListDrawer.js'

export { InlineBlockEditButton } from '../../features/blocks/client/componentInline/components/InlineBlockEditButton.js'
export { InlineBlockRemoveButton } from '../../features/blocks/client/componentInline/components/InlineBlockRemoveButton.js'
export { InlineBlockLabel } from '../../features/blocks/client/componentInline/components/InlineBlockLabel.js'
export { InlineBlockContainer } from '../../features/blocks/client/componentInline/components/InlineBlockContainer.js'
export { useInlineBlockComponentContext } from '../../features/blocks/client/componentInline/index.js'
export { BlockCollapsible } from '../../features/blocks/client/component/components/BlockCollapsible.js'
export { BlockEditButton } from '../../features/blocks/client/component/components/BlockEditButton.js'
export { BlockRemoveButton } from '../../features/blocks/client/component/components/BlockRemoveButton.js'
export { useBlockComponentContext } from '../../features/blocks/client/component/BlockContent.js'
export { getRestPopulateFn } from '../../features/converters/utilities/restPopulateFn.js'
