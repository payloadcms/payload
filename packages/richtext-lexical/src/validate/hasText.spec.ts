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

describe('hasText', () => {
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

  it('should return true for a paragraph with a non-text child', () => {
    expect(
      hasText(rootNode([paragraphNode([textNode(''), { type: 'linebreak', version: 1 }])])),
    ).toBe(true)
  })

  it('should return true when any paragraph has text', () => {
    expect(hasText(rootNode([paragraphNode(), paragraphNode([textNode('Hello')])]))).toBe(true)
  })

  it('should return true when the root contains a non-paragraph node', () => {
    expect(hasText(rootNode([paragraphNode(), { type: 'upload', version: 1 }]))).toBe(true)
  })
})
