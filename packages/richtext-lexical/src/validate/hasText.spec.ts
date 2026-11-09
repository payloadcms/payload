import type {
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical'

import { describe, expect, it } from 'vitest'

import { hasText } from './hasText.js'

function rootNode(children: SerializedLexicalNode[]): SerializedEditorState {
  return {
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function paragraphNode(children: SerializedLexicalNode[] = []): SerializedParagraphNode {
  return {
    type: 'paragraph',
    children,
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    version: 1,
  }
}

function headingNode(children: SerializedLexicalNode[] = [], tag = 'h2'): SerializedLexicalNode {
  return {
    type: 'heading',
    tag,
    children,
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  } as unknown as SerializedLexicalNode
}

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

function linebreakNode(): SerializedLexicalNode {
  return {
    type: 'linebreak',
    version: 1,
  }
}

describe('hasText', () => {
  it('should return false for null or undefined or empty root', () => {
    expect(hasText(null)).toBe(false)
    expect(hasText(undefined)).toBe(false)
    expect(hasText(rootNode([]))).toBe(false)
  })

  it('should return false for a single empty paragraph', () => {
    expect(hasText(rootNode([paragraphNode()]))).toBe(false)
  })

  it('should return false for multiple empty paragraphs', () => {
    expect(hasText(rootNode([paragraphNode(), paragraphNode([textNode('')])]))).toBe(false)
  })

  it('should return false for a paragraph with several empty text nodes', () => {
    expect(hasText(rootNode([paragraphNode(), paragraphNode([textNode(''), textNode('')])]))).toBe(
      false,
    )
  })

  it('should return false for a paragraph with only a linebreak node (Shift+Enter in empty editor)', () => {
    expect(hasText(rootNode([paragraphNode([linebreakNode()])]))).toBe(false)
    expect(hasText(rootNode([paragraphNode([textNode(''), linebreakNode()])]))).toBe(false)
  })

  it('should return false for an empty heading (slash menu selection in empty editor)', () => {
    expect(hasText(rootNode([headingNode([])]))).toBe(false)
    expect(hasText(rootNode([headingNode([textNode('')])]))).toBe(false)
    expect(hasText(rootNode([headingNode([linebreakNode()])]))).toBe(false)
  })

  it('should return false when editor contains a mix of empty paragraphs and empty headings', () => {
    expect(
      hasText(
        rootNode([
          paragraphNode([linebreakNode()]),
          headingNode([]),
          paragraphNode([textNode('')]),
        ]),
      ),
    ).toBe(false)
  })

  it('should return true when any paragraph has text', () => {
    expect(hasText(rootNode([paragraphNode(), paragraphNode([textNode('Hello')])]))).toBe(true)
  })

  it('should return true when a heading has text', () => {
    expect(hasText(rootNode([headingNode([textNode('Section Title')])]))).toBe(true)
  })

  it('should return true when the root contains a non-paragraph/non-heading node', () => {
    expect(hasText(rootNode([paragraphNode(), { type: 'upload', version: 1 }]))).toBe(true)
    expect(hasText(rootNode([{ type: 'block', version: 1 }]))).toBe(true)
  })

  it('should return true for a paragraph with a non-text and non-linebreak child (e.g. inline decorator)', () => {
    expect(
      hasText(rootNode([paragraphNode([{ type: 'inline-block', version: 1 }])])),
    ).toBe(true)
  })
})
