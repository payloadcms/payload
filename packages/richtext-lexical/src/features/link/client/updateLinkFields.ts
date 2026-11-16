import type { LexicalEditor, LexicalNode, SerializedLexicalNode } from 'lexical'

import { dequal } from 'dequal/lite'
import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  HISTORY_MERGE_TAG,
  SKIP_DOM_SELECTION_TAG,
} from 'lexical'

import type { LinkFields } from '../server/schema.js'

import { $isLinkNode } from '../nodes/LinkNode.js'

type SerializedNode = {
  children?: SerializedNode[]
  fields?: LinkFields
} & SerializedLexicalNode

// Preserve node keys and open drawers when the server only changes link fields.
export function updateLinkFields({
  editor,
  value,
}: {
  editor: LexicalEditor
  value: { root: SerializedNode }
}): boolean {
  const updates = new Map<string, LinkFields>()

  const canUpdate = editor.getEditorState().read(() => {
    const visit = (node: LexicalNode, serializedNode: SerializedNode): boolean => {
      const { children: _children, ...current } = JSON.parse(
        JSON.stringify(node.exportJSON()),
      ) as SerializedNode
      const { children, ...next } = serializedNode

      if ($isLinkNode(node) && next.type === node.getType() && next.fields) {
        updates.set(node.getKey(), next.fields)
        current.fields = next.fields
      }

      if (!dequal(current, next)) {
        return false
      }

      const childNodes = $isElementNode(node) ? node.getChildren() : []

      return (
        childNodes.length === (children?.length ?? 0) &&
        childNodes.every((child, index) => visit(child, children![index]!))
      )
    }

    return visit($getRoot(), value.root)
  })

  if (!canUpdate) {
    return false
  }

  // OnChangePlugin ignores history-merge updates, so server values do not schedule another save.
  editor.update(
    () => {
      for (const [key, fields] of updates) {
        const node = $getNodeByKey(key)

        if ($isLinkNode(node) && !dequal(node.getFields(), fields)) {
          node.setFields(fields)
        }
      }
    },
    { discrete: true, tag: [HISTORY_MERGE_TAG, SKIP_DOM_SELECTION_TAG] },
  )

  return true
}
