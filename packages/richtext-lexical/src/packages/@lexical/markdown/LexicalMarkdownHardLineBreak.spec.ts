import { createHeadlessEditor } from '@lexical/headless'
import { ListItemNode, ListNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $getRoot, $isElementNode, $isLineBreakNode } from 'lexical'
import { describe, expect, it } from 'vitest'

import { $convertFromMarkdownString, $convertToMarkdownString } from './index.js'
import { normalizeMarkdown } from './MarkdownTransformers.js'

function createEditor() {
  return createHeadlessEditor({ nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode] })
}

function importMarkdown(markdown: string): { hasLineBreak: boolean; textContent: string } {
  const editor = createEditor()
  editor.update(() => $convertFromMarkdownString(markdown), { discrete: true })
  let result = { hasLineBreak: false, textContent: '' }
  editor.getEditorState().read(() => {
    const firstChild = $getRoot().getFirstChild()
    if (!$isElementNode(firstChild)) {
      throw new Error('Expected an element block')
    }
    result = {
      hasLineBreak: firstChild.getChildren().some((child) => $isLineBreakNode(child)),
      textContent: firstChild.getTextContent(),
    }
  })
  return result
}

function roundTrip(markdown: string): string {
  const editor = createEditor()
  editor.update(() => $convertFromMarkdownString(markdown), { discrete: true })
  let output = ''
  editor.getEditorState().read(() => {
    output = $convertToMarkdownString()
  })
  return output
}

describe('markdown hard line break normalization', () => {
  it('should preserve trailing-space hard breaks when merging adjacent lines', () => {
    const md = ['foo  ', 'bar'].join('\n')
    expect(normalizeMarkdown(md, true)).toBe(md)
  })

  it('should preserve the exact number of trailing spaces', () => {
    const md = ['foo   ', 'bar'].join('\n')
    expect(normalizeMarkdown(md, true)).toBe(md)
  })

  it('should preserve backslash hard breaks when merging adjacent lines', () => {
    const md = 'foo\\\nbar'
    expect(normalizeMarkdown(md, true)).toBe(md)
  })

  it('should still merge a soft break into the previous line', () => {
    const md = ['foo', 'bar'].join('\n')
    expect(normalizeMarkdown(md, true)).toBe('foo bar')
  })

  it('should merge a soft break before a hard-breaking line', () => {
    const md = ['foo', 'bar  ', 'baz'].join('\n')
    expect(normalizeMarkdown(md, true)).toBe(['foo bar  ', 'baz'].join('\n'))
  })
})

describe('markdown hard line break import', () => {
  it('should import a trailing-space hard break as a line break node with the marker stripped', () => {
    const { hasLineBreak, textContent } = importMarkdown(['foo  ', 'bar'].join('\n'))

    expect(hasLineBreak).toBe(true)
    // The marker is stripped from the text and represented by the line break node.
    expect(textContent).toBe('foo\nbar')
  })

  it('should import a backslash hard break as a line break node with the marker stripped', () => {
    const { hasLineBreak, textContent } = importMarkdown('foo\\\nbar')

    expect(hasLineBreak).toBe(true)
    expect(textContent).toBe('foo\nbar')
  })
})

describe('markdown hard line break round trip', () => {
  it('should round trip a trailing-space hard break', () => {
    const md = ['foo  ', 'bar'].join('\n')
    expect(roundTrip(md)).toBe(md)
  })

  it('should round trip a backslash hard break', () => {
    const md = 'foo\\\nbar'
    expect(roundTrip(md)).toBe(md)
  })

  it('should not introduce a hard break for a soft wrap', () => {
    expect(roundTrip(['foo', 'bar'].join('\n'))).toBe('foo bar')
  })
})
