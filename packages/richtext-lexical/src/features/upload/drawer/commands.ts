'use client'
import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

export const INSERT_UPLOAD_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_UPLOAD_WITH_DRAWER_COMMAND')
