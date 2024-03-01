import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import type { InsertBlockPayload } from './index'

export const INSERT_BLOCK_COMMAND: LexicalCommand<InsertBlockPayload> =
  createCommand('INSERT_BLOCK_COMMAND')
