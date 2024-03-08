import type { LexicalCommand } from 'lexical'

import lexicalImport from 'lexical'
const { createCommand } = lexicalImport

import type { InsertBlockPayload } from './index.js'

export const INSERT_BLOCK_COMMAND: LexicalCommand<InsertBlockPayload> =
  createCommand('INSERT_BLOCK_COMMAND')
