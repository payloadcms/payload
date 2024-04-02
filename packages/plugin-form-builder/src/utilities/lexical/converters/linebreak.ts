import type { HTMLConverter } from '../types.js'

export const LinebreakHTMLConverter: HTMLConverter<any> = {
  converter() {
    return `<br>`
  },
  nodeTypes: ['linebreak'],
}
