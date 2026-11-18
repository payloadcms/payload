import type { LexicalCommand, SerializedEditorState } from 'lexical'

import { createCommand } from 'lexical'

/**
 * A feature may handle an external value if it can apply the entire change without replacing nodes.
 * Returning false leaves the field's full editor reset in place.
 */
export const UPDATE_EDITOR_STATE_COMMAND: LexicalCommand<SerializedEditorState> = createCommand(
  'UPDATE_EDITOR_STATE_COMMAND',
)
