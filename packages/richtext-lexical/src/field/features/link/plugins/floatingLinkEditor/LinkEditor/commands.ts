import type { LexicalCommand } from 'lexical'

import lexicalImport from 'lexical'
const { createCommand } = lexicalImport

import type { LinkPayload } from '../types.js'

export const TOGGLE_LINK_WITH_MODAL_COMMAND: LexicalCommand<LinkPayload | null> = createCommand(
  'TOGGLE_LINK_WITH_MODAL_COMMAND',
)
