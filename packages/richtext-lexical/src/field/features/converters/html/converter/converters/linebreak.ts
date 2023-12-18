import type { SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types'

export const LinebreakHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  converter() {
    return `<br>`
  },
  nodeTypes: ['linebreak'],
}
