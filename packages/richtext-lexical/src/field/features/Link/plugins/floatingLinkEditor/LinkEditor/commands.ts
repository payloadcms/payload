import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import type { LinkPayload } from '../types'

export const TOGGLE_LINK_WITH_MODAL_COMMAND: LexicalCommand<LinkPayload | null> = createCommand(
  'TOGGLE_LINK_WITH_MODAL_COMMAND',
)
