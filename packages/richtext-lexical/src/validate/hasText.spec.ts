import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import { describe, expect, it } from 'vitest'

import { hasText } from './hasText.js'

function editorState(children: SerializedLexicalNode[]): SerializedEditorState {
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

function paragraph(children: SerializedLexicalNode[] = []): SerializedLexicalNode {
  return {
    type: 'paragraph',
    children,
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    version: 1,
  } as SerializedLexicalNode
}

function text(value: string): SerializedLexicalNode {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: value,
    version: 1,
  } as SerializedLexicalNode
}

describe('hasText', () => {
  it('should return false for a single empty paragraph', () => {
    expect(hasText(editorState([paragraph()]))).toBe(false)
  })

  it('should return false for multiple empty paragraphs', () => {
    expect(hasText(editorState([paragraph(), paragraph([text('')])]))).toBe(false)
  })

  it('should return true when any paragraph has text', () => {
    expect(hasText(editorState([paragraph(), paragraph([text('Hello')])]))).toBe(true)
  })

  it('should return true for content without text', () => {
    expect(hasText(editorState([paragraph(), { type: 'upload', version: 1 }]))).toBe(true)
  })
})
