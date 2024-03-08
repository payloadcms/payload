'use client'
import type { LexicalCommand } from 'lexical'

import lexicalImport from 'lexical'
const { createCommand } = lexicalImport

export const INSERT_UPLOAD_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_UPLOAD_WITH_DRAWER_COMMAND')
