'use client'
import type { LexicalCommand, LexicalNode } from 'lexical'

import { createCommand } from 'lexical'

import type { WrapperBlockFields } from '../../WrapperBlockNode.js'
import type { InsertBlockPayload } from './index.js'

export const INSERT_BLOCK_COMMAND: LexicalCommand<InsertBlockPayload> =
  createCommand('INSERT_BLOCK_COMMAND')

export const INSERT_INLINE_BLOCK_COMMAND: LexicalCommand<Partial<InsertBlockPayload>> =
  createCommand('INSERT_INLINE_BLOCK_COMMAND')

export const INSERT_WRAPPER_BLOCK_COMMAND: LexicalCommand<Partial<null | WrapperBlockFields>> =
  createCommand('INSERT_WRAPPER_BLOCK_COMMAND')

export type WrapperBlockPayload = {
  fields: WrapperBlockFields

  selectedNodes?: LexicalNode[]
  /**
   * The text content of the WrapperBlock node - will be displayed in the drawer
   */
  text: null | string
}

export const TOGGLE_WRAPPER_BLOCK_WITH_MODAL_COMMAND: LexicalCommand<null | WrapperBlockPayload> =
  createCommand('TOGGLE_WRAPPER_BLOCK_WITH_MODAL_COMMAND')
