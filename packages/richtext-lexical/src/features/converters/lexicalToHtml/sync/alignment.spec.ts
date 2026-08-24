import { describe, expect, it } from 'vitest'
import type {
  DefaultTypedEditorState,
  LexicalElementDirection,
  LexicalElementFormat,
  SerializedParagraphNode,
  SerializedTextNode,
} from '../../../../types/nodeTypes.js'

import { convertLexicalToHTML } from './index.js'

function textNode(text: string): SerializedTextNode {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }
}

function paragraphNode({
  direction = null,
  format,
}: {
  direction?: LexicalElementDirection
  format: LexicalElementFormat
}): SerializedParagraphNode {
  return {
    type: 'paragraph',
    children: [textNode('مرحبا')],
    direction,
    format,
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function rootNode(paragraph: SerializedParagraphNode): DefaultTypedEditorState {
  return {
    root: {
      type: 'root',
      children: [paragraph],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

describe('convertLexicalToHTML - paragraph alignment', () => {
  it('preserves logical alignment for format: start', () => {
    const html = convertLexicalToHTML({
      data: rootNode(paragraphNode({ format: 'start' })),
      disableContainer: true,
    })

    expect(html).toBe('<p style="text-align: start;">مرحبا</p>')
  })

  it('preserves logical alignment for format: end', () => {
    const html = convertLexicalToHTML({
      data: rootNode(paragraphNode({ format: 'end' })),
      disableContainer: true,
    })

    expect(html).toBe('<p style="text-align: end;">مرحبا</p>')
  })

  it('emits text-align for explicit format: left', () => {
    const html = convertLexicalToHTML({
      data: rootNode(paragraphNode({ format: 'left' })),
      disableContainer: true,
    })

    expect(html).toBe('<p style="text-align: left;">مرحبا</p>')
  })

  it('emits text-align for explicit format: right', () => {
    const html = convertLexicalToHTML({
      data: rootNode(paragraphNode({ format: 'right' })),
      disableContainer: true,
    })

    expect(html).toBe('<p style="text-align: right;">مرحبا</p>')
  })

  it('preserves logical alignment start for RTL-directed paragraphs', () => {
    const html = convertLexicalToHTML({
      data: rootNode(paragraphNode({ direction: 'rtl', format: 'start' })),
      disableContainer: true,
    })

    // For RTL content, `start` must NOT be resolved to `left` - it must stay logical
    // (or resolve to `right`, its physical RTL equivalent), otherwise the paragraph
    // renders visually misaligned against the text's own reading direction.
    expect(html).not.toBe('<p style="text-align: left;">مرحبا</p>')
    expect(html).toBe('<p style="text-align: start;">مرحبا</p>')
  })
})
