import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import type { InlineFieldsData } from '../nodes/InlineFieldsNode.js'

export const INSERT_INLINE_FIELDS_COMMAND: LexicalCommand<Partial<InlineFieldsData>> =
  createCommand('INSERT_INLINE_FIELDS_COMMAND')

export const OPEN_INLINE_FIELDS_DRAWER_COMMAND: LexicalCommand<
  {
    nodeKey?: string
  } & Omit<InlineFieldsData, 'id'>
> = createCommand('OPEN_INLINE_FIELDS_DRAWER_COMMAND')
