import type { SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'

import { getEnabledNodes } from '../lexical/nodes/index.js'

/**
 * Ensures serialized Lexical JSON only uses node types registered for this field.
 * Otherwise Lexical throws at runtime (e.g. minified error #17 for type "list").
 */
export function validateLexicalStateParsable(
  value: SerializedEditorState,
  editorConfig: SanitizedServerEditorConfig,
): boolean {
  try {
    const headlessEditor = createHeadlessEditor({
      nodes: getEnabledNodes({ editorConfig }),
    })

    headlessEditor.update(
      () => {
        headlessEditor.setEditorState(headlessEditor.parseEditorState(value))
      },
      { discrete: true },
    )

    return true
  } catch {
    return false
  }
}
