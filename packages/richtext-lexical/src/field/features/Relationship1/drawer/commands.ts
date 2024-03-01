import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

export const INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND')
