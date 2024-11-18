'use client'
import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import type { InsertBlockPayload } from './index.js'

export const INSERT_BLOCK_COMMAND: LexicalCommand<InsertBlockPayload> =
  createCommand('INSERT_BLOCK_COMMAND')

export const INSERT_INLINE_BLOCK_COMMAND: LexicalCommand<Partial<InsertBlockPayload>> =
  createCommand('INSERT_INLINE_BLOCK_COMMAND')
