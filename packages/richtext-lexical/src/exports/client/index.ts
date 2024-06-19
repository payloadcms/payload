/* eslint-disable perfectionist/sort-exports */
'use client'

export { RichTextCell } from '../../cell/index.js'
export { AlignFeatureClientComponent } from '../../features/align/feature.client.js'
export { BlockquoteFeatureClientComponent } from '../../features/blockquote/feature.client.js'
export { BlocksFeatureClientComponent } from '../../features/blocks/feature.client.js'
export { createClientComponent } from '../../features/createClientComponent.js'
export { TestRecorderFeatureClientComponent } from '../../features/debug/testRecorder/feature.client.js'
export { TreeViewFeatureClientComponent } from '../../features/debug/treeView/feature.client.js'
export { BoldFeatureClientComponent } from '../../features/format/bold/feature.client.js'
export { InlineCodeFeatureClientComponent } from '../../features/format/inlineCode/feature.client.js'
export { ItalicFeatureClientComponent } from '../../features/format/italic/feature.client.js'
export { toolbarFormatGroupWithItems } from '../../features/format/shared/toolbarFormatGroup.js'
export { StrikethroughFeatureClientComponent } from '../../features/format/strikethrough/feature.client.js'
export { SubscriptFeatureClientComponent } from '../../features/format/subscript/feature.client.js'
export { SuperscriptFeatureClientComponent } from '../../features/format/superscript/feature.client.js'
export { UnderlineFeatureClientComponent } from '../../features/format/underline/feature.client.js'
export { HeadingFeatureClientComponent } from '../../features/heading/feature.client.js'
export { HorizontalRuleFeatureClientComponent } from '../../features/horizontalRule/feature.client.js'
export { IndentFeatureClientComponent } from '../../features/indent/feature.client.js'
export { LinkFeatureClientComponent } from '../../features/link/feature.client.js'
export { ChecklistFeatureClientComponent } from '../../features/lists/checklist/feature.client.js'
export { OrderedListFeatureClientComponent } from '../../features/lists/orderedList/feature.client.js'
export { UnorderedListFeatureClientComponent } from '../../features/lists/unorderedList/feature.client.js'
export { LexicalPluginToLexicalFeatureClientComponent } from '../../features/migrations/lexicalPluginToLexical/feature.client.js'
export { SlateToLexicalFeatureClientComponent } from '../../features/migrations/slateToLexical/feature.client.js'
export { ParagraphFeatureClientComponent } from '../../features/paragraph/feature.client.js'

export { RelationshipFeatureClientComponent } from '../../features/relationship/feature.client.js'

export { toolbarAddDropdownGroupWithItems } from '../../features/shared/toolbar/addDropdownGroup.js'
export { toolbarFeatureButtonsGroupWithItems } from '../../features/shared/toolbar/featureButtonsGroup.js'
export { toolbarTextDropdownGroupWithItems } from '../../features/shared/toolbar/textDropdownGroup.js'
export { FixedToolbarFeatureClientComponent } from '../../features/toolbars/fixed/feature.client.js'
export { InlineToolbarFeatureClientComponent } from '../../features/toolbars/inline/feature.client.js'
export { ToolbarButton } from '../../features/toolbars/shared/ToolbarButton/index.js'

export { ToolbarDropdown } from '../../features/toolbars/shared/ToolbarDropdown/index.js'
export { UploadFeatureClientComponent } from '../../features/upload/feature.client.js'

export { RichTextField } from '../../field/index.js'
export {
  type EditorConfigContextType,
  EditorConfigProvider,
  useEditorConfigContext,
} from '../../lexical/config/client/EditorConfigProvider.js'
export { defaultEditorLexicalConfig } from '../../lexical/config/client/default.js'

export {
  sanitizeClientEditorConfig,
  sanitizeClientFeatures,
} from '../../lexical/config/client/sanitize.js'
export { CAN_USE_DOM } from '../../lexical/utils/canUseDOM.js'
export { cloneDeep } from '../../lexical/utils/cloneDeep.js'
export { getDOMRangeRect } from '../../lexical/utils/getDOMRangeRect.js'
export { getSelectedNode } from '../../lexical/utils/getSelectedNode.js'
export { isHTMLElement } from '../../lexical/utils/guard.js'
export { invariant } from '../../lexical/utils/invariant.js'
export { joinClasses } from '../../lexical/utils/joinClasses.js'

export { createBlockNode } from '../../lexical/utils/markdown/createBlockNode.js'
export { Point, isPoint } from '../../lexical/utils/point.js'
export { Rect } from '../../lexical/utils/rect.js'
export { setFloatingElemPosition } from '../../lexical/utils/setFloatingElemPosition.js'
export { setFloatingElemPositionForLinkEditor } from '../../lexical/utils/setFloatingElemPositionForLinkEditor.js'

export {
  addSwipeDownListener,
  addSwipeLeftListener,
  addSwipeRightListener,
  addSwipeUpListener,
} from '../../lexical/utils/swipe.js'
