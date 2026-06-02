import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

export const INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: false | { nodeKey: string }
}> = createCommand('INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND')
