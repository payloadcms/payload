import type { ListItemNode } from '@lexical/list'
import type { ElementTransformer } from '@lexical/markdown'
import type { LexicalNode } from 'lexical'

import { $isListItemNode } from '@lexical/list'
import { CHECK_LIST } from '@lexical/markdown'
import { $getSelection, $isRangeSelection } from 'lexical'

/**
 * Typed checklist shortcut.
 *
 * Enter stores the caret format on the new paragraph. The checklist
 * transformer moves that line into a list item, and the list plugin copies
 * the caret format onto the empty item, so text typed after `[x] ` keeps
 * strikethrough (or bold, italic, ...) from the previous line. Toggling the
 * format off only flips the caret; the block format is what gets copied back.
 *
 * The shortcut appends whatever already followed the caret. Clear the list
 * item's own text format and the caret format, and leave those text nodes
 * alone.
 *
 * Markdown import passes `isImport` and keeps formatting written in the source.
 */
export const PAYLOAD_CHECK_LIST: ElementTransformer = {
  ...CHECK_LIST,
  replace: (parentNode, children, match, isImport) => {
    const result = CHECK_LIST.replace(parentNode, children, match, isImport)

    if (result === false || isImport) {
      return result
    }

    $clearInheritedInlineFormat()

    return result
  },
}

function $clearInheritedInlineFormat(): void {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return
  }

  const listItem = $getSelectedListItem({ node: selection.anchor.getNode() })

  if (listItem == null) {
    return
  }

  listItem.setTextFormat(0)
  selection.setFormat(0)
}

function $getSelectedListItem({ node }: { node: LexicalNode }): ListItemNode | null {
  if ($isListItemNode(node)) {
    return node
  }

  const parent = node.getParent()

  if ($isListItemNode(parent)) {
    return parent
  }

  return null
}
