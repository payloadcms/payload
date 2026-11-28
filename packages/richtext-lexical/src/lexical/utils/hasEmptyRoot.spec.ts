import type { SerializedEditorState } from 'lexical'

import { describe, expect, it } from 'vitest'

import { hasEmptyRoot } from './hasEmptyRoot.js'

const emptyRoot = {
  root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 },
} as unknown as SerializedEditorState

const emptyParagraphRoot = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState

describe('hasEmptyRoot', () => {
  it('detects a root node without children', () => {
    expect(hasEmptyRoot(emptyRoot)).toBe(true)
  })

  it('treats the default empty editor (one empty paragraph) as not empty', () => {
    expect(hasEmptyRoot(emptyParagraphRoot)).toBe(false)
  })

  it('ignores values that are not a serialized editor state', () => {
    expect(hasEmptyRoot(null)).toBe(false)
    expect(hasEmptyRoot(undefined)).toBe(false)
    expect(hasEmptyRoot({} as SerializedEditorState)).toBe(false)
    expect(hasEmptyRoot({ root: {} } as unknown as SerializedEditorState)).toBe(false)
    expect(hasEmptyRoot({ root: { children: null } } as unknown as SerializedEditorState)).toBe(
      false,
    )
  })
})
