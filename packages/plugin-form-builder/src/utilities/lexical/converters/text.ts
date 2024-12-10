import type { HTMLConverter } from '../types.js'

import { replaceDoubleCurlys } from '../../replaceDoubleCurlys.js'
import { NodeFormat } from '../nodeFormat.js'

export const TextHTMLConverter: HTMLConverter<any> = {
  converter({ node, submissionData }) {
    let text = node.text

    if (submissionData) {
      text = replaceDoubleCurlys(text, submissionData)
    }

    if (node.format & NodeFormat.IS_BOLD) {
      text = `<strong>${text}</strong>`
    }
    if (node.format & NodeFormat.IS_ITALIC) {
      text = `<em>${text}</em>`
    }
    if (node.format & NodeFormat.IS_STRIKETHROUGH) {
      text = `<span style="text-decoration: line-through">${text}</span>`
    }
    if (node.format & NodeFormat.IS_UNDERLINE) {
      text = `<span style="text-decoration: underline">${text}</span>`
    }
    if (node.format & NodeFormat.IS_CODE) {
      text = `<code>${text}</code>`
    }
    if (node.format & NodeFormat.IS_SUBSCRIPT) {
      text = `<sub>${text}</sub>`
    }
    if (node.format & NodeFormat.IS_SUPERSCRIPT) {
      text = `<sup>${text}</sup>`
    }

    return text
  },
  nodeTypes: ['text'],
}
