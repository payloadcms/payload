import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { RichTextHooks } from 'payload'

import type { UploadFeatureServerProps } from './index.js'
import type { SerializedUploadNode } from './schema.js'

import { recurseNodeTree } from '../../../utilities/recurseNodeTree.js'

/**
 * Upload nodes created from pasted HTML (`data-lexical-upload-id`) carry their ID as a string, as DOM
 * attributes are always strings. For collections with numeric IDs (e.g. Postgres or SQLite) that string
 * would then fail validation or be stored with the wrong type.
 *
 * This hook converts such string IDs to numbers, based on the ID type of the node's target collection.
 */
export const coerceUploadIDs = (
  props: UploadFeatureServerProps,
): NonNullable<RichTextHooks['beforeValidate']>[number] => {
  return ({ req, value }) => {
    const root = (value as SerializedEditorState | undefined)?.root

    if (!root?.children?.length) {
      return value
    }

    const flattenedNodes: SerializedLexicalNode[] = []
    recurseNodeTree({ flattenedNodes, nodes: root.children })

    for (const node of flattenedNodes) {
      if (node.type !== 'upload') {
        continue
      }

      const uploadNode = node as SerializedUploadNode

      if (
        typeof uploadNode.value !== 'string' ||
        !props.enabledCollectionSlugs.includes(uploadNode.relationTo)
      ) {
        continue
      }

      const idType =
        req.payload.collections[uploadNode.relationTo]?.customIDType || req.payload.db.defaultIDType

      if (idType === 'number' && /^(?:0|-?[1-9]\d*)$/.test(uploadNode.value)) {
        const numericID = Number(uploadNode.value)

        if (Number.isSafeInteger(numericID)) {
          ;(uploadNode as { value: unknown }).value = numericID
        }
      }
    }

    return value
  }
}
