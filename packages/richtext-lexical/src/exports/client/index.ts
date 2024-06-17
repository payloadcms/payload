/* eslint-disable perfectionist/sort-exports */
'use client'

export { RichTextCell } from '../../cell/index.js'
export { AlignFeatureClientComponent } from '../../field/features/align/feature.client.js'
export { BlockquoteFeatureClientComponent } from '../../field/features/blockquote/feature.client.js'
export { BlocksFeatureClientComponent } from '../../field/features/blocks/feature.client.js'
export { createClientComponent } from '../../field/features/createClientComponent.js'
export { TestRecorderFeatureClientComponent } from '../../field/features/debug/testRecorder/feature.client.js'
export { TreeViewFeatureClientComponent } from '../../field/features/debug/treeView/feature.client.js'
export { BoldFeatureClientComponent } from '../../field/features/format/bold/feature.client.js'
export { InlineCodeFeatureClientComponent } from '../../field/features/format/inlineCode/feature.client.js'
export { ItalicFeatureClientComponent } from '../../field/features/format/italic/feature.client.js'
export { toolbarFormatGroupWithItems } from '../../field/features/format/shared/toolbarFormatGroup.js'
export { StrikethroughFeatureClientComponent } from '../../field/features/format/strikethrough/feature.client.js'
export { SubscriptFeatureClientComponent } from '../../field/features/format/subscript/feature.client.js'
export { SuperscriptFeatureClientComponent } from '../../field/features/format/superscript/feature.client.js'
export { UnderlineFeatureClientComponent } from '../../field/features/format/underline/feature.client.js'
export { HeadingFeatureClientComponent } from '../../field/features/heading/feature.client.js'
export { HorizontalRuleFeatureClientComponent } from '../../field/features/horizontalRule/feature.client.js'
export { IndentFeatureClientComponent } from '../../field/features/indent/feature.client.js'
export { LinkFeatureClientComponent } from '../../field/features/link/feature.client.js'
export { ChecklistFeatureClientComponent } from '../../field/features/lists/checklist/feature.client.js'
export { OrderedListFeatureClientComponent } from '../../field/features/lists/orderedList/feature.client.js'
export { UnorderedListFeatureClientComponent } from '../../field/features/lists/unorderedList/feature.client.js'
export { LexicalPluginToLexicalFeatureClientComponent } from '../../field/features/migrations/lexicalPluginToLexical/feature.client.js'
export { SlateToLexicalFeatureClientComponent } from '../../field/features/migrations/slateToLexical/feature.client.js'
export { ParagraphFeatureClientComponent } from '../../field/features/paragraph/feature.client.js'

export { RelationshipFeatureClientComponent } from '../../field/features/relationship/feature.client.js'

export { toolbarAddDropdownGroupWithItems } from '../../field/features/shared/toolbar/addDropdownGroup.js'
export { toolbarFeatureButtonsGroupWithItems } from '../../field/features/shared/toolbar/featureButtonsGroup.js'
export { toolbarTextDropdownGroupWithItems } from '../../field/features/shared/toolbar/textDropdownGroup.js'
export { FixedToolbarFeatureClientComponent } from '../../field/features/toolbars/fixed/feature.client.js'
export { InlineToolbarFeatureClientComponent } from '../../field/features/toolbars/inline/feature.client.js'
export { ToolbarButton } from '../../field/features/toolbars/shared/ToolbarButton/index.js'

export { ToolbarDropdown } from '../../field/features/toolbars/shared/ToolbarDropdown/index.js'
export { UploadFeatureClientComponent } from '../../field/features/upload/feature.client.js'

export { RichTextField } from '../../field/index.js'
export {
  type EditorConfigContextType,
  EditorConfigProvider,
  useEditorConfigContext,
} from '../../field/lexical/config/client/EditorConfigProvider.js'
export { defaultEditorLexicalConfig } from '../../field/lexical/config/client/default.js'

export {
  sanitizeClientEditorConfig,
  sanitizeClientFeatures,
} from '../../field/lexical/config/client/sanitize.js'
export { CAN_USE_DOM } from '../../field/lexical/utils/canUseDOM.js'
export { cloneDeep } from '../../field/lexical/utils/cloneDeep.js'
export { getDOMRangeRect } from '../../field/lexical/utils/getDOMRangeRect.js'
export { getSelectedNode } from '../../field/lexical/utils/getSelectedNode.js'
export { isHTMLElement } from '../../field/lexical/utils/guard.js'
export { invariant } from '../../field/lexical/utils/invariant.js'
export { joinClasses } from '../../field/lexical/utils/joinClasses.js'

export { createBlockNode } from '../../field/lexical/utils/markdown/createBlockNode.js'
export { Point, isPoint } from '../../field/lexical/utils/point.js'
export { Rect } from '../../field/lexical/utils/rect.js'
export { setFloatingElemPosition } from '../../field/lexical/utils/setFloatingElemPosition.js'
export { setFloatingElemPositionForLinkEditor } from '../../field/lexical/utils/setFloatingElemPositionForLinkEditor.js'

export {
  addSwipeDownListener,
  addSwipeLeftListener,
  addSwipeRightListener,
  addSwipeUpListener,
} from '../../field/lexical/utils/swipe.js'
