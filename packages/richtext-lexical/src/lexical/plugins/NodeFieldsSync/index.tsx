'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useForm } from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import { useEffect } from 'react'

import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'

const NODE_METADATA_KEYS = new Set(['blockName', 'blockType', 'id'])

/**
 * Always-loaded Lexical plugin that synchronises programmatic
 * `node.setFields()` / `node.setSubFieldValue()` calls back into
 * Payload's form state.
 *
 * ## How it works
 *
 * A single `registerUpdateListener` inspects every dirty node after each
 * editor update.  For nodes that expose a `getFields()` method (blocks,
 * inline blocks, links, uploads …) each field value is compared against
 * the current form state via `getField()`.  When they differ, the new
 * value is pushed into form state with `dispatchFields`.
 *
 * A local `Map` tracks the last-seen `__fields` reference per node key.
 * When the reference hasn't changed (the common case — ancestor nodes get
 * dirtied by child text edits without their own fields changing) the
 * plugin skips the per-field comparison entirely.
 *
 * ## Why there is no cycle
 *
 * - **node → form** (this plugin): calls `dispatchFields` which updates the
 *   React reducer directly.  `useField.setValue` is never invoked, so the
 *   `FieldChangeNotifier` callback that `RenderLexicalFields` listens on
 *   is never triggered — no write-back to the node occurs.
 *
 * - **form → node** (`RenderLexicalFields`): calls `node.setSubFieldValue`
 *   inside `editor.update()`.  The update listener fires and sees a new
 *   `__fields` reference, but `getField()` already returns the value the
 *   user just typed (the form state update preceded the rAF that flushes
 *   to the node), so the comparison matches and no dispatch happens.
 */
export const NodeFieldsSyncPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const { dispatchFields, getField } = useForm()
  const {
    fieldProps: { path: editorPath },
  } = useEditorConfigContext()

  useEffect(() => {
    const prevFields = new Map<string, Record<string, unknown>>()

    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState }) => {
      editorState.read(() => {
        for (const key of [...dirtyElements.keys(), ...dirtyLeaves]) {
          const node = $getNodeByKey(key)
          if (!node || !('getFields' in node)) {
            continue
          }

          const fields = (node as unknown as { getFields(): Record<string, unknown> }).getFields()

          const prev = prevFields.get(key)
          prevFields.set(key, fields)

          if (fields === prev) {
            continue
          }

          const nodeId = fields.id as string | undefined
          if (!nodeId) {
            continue
          }

          const parentPath = `${editorPath}.${nodeId}`

          for (const [k, v] of Object.entries(fields)) {
            if (NODE_METADATA_KEYS.has(k)) {
              continue
            }
            const f = getField(`${parentPath}.${k}`)
            // Skip if the field isn't in form state yet (buildFormState
            // hasn't run), or if the value already matches.  Loose ==
            // treats null and undefined as equal.
            if (!f || !('value' in f) || f.value == v) {
              continue
            }
            dispatchFields({ type: 'UPDATE', path: `${parentPath}.${k}`, value: v })
          }
        }
      })
    })
  }, [editor, editorPath, dispatchFields, getField])

  return null
}
