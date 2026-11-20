import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../serializeLexical.js'

export const ParagraphHTMLConverter: HTMLConverter<any> = {
  async converter({ converters, node, parent, submissionData }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
      submissionData,
    })
    // The {{*:table}} variable expands to a block-level <table>, which a <p> cannot contain
    if (childrenText.includes('<table')) {
      return childrenText
    }

    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
