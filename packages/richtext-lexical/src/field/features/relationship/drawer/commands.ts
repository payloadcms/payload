import type { LexicalCommand } from 'lexical'

import lexicalImport from 'lexical'
const { createCommand } = lexicalImport

export const INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND')
