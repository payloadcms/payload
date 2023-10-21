import type { SerializedTextNode } from 'lexical'

import type { HTMLConverter } from '../types'

export const TextHTMLConverter: HTMLConverter<SerializedTextNode> = {
  converter({ node }) {
    return `${node.text}`
  },
  nodeTypes: ['text'],
}
