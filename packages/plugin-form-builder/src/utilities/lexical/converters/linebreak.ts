import type { HTMLConverter } from '../types'

export const LinebreakHTMLConverter: HTMLConverter<any> = {
  converter() {
    return `<br>`
  },
  nodeTypes: ['linebreak'],
}
