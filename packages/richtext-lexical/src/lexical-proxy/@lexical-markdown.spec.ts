import { createHeadlessEditor } from '@lexical/headless'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $getRoot, $isElementNode, $isLineBreakNode } from 'lexical'
import { describe, expect, it } from 'vitest'

import { $convertFromMarkdownString, $convertToMarkdownString } from './@lexical-markdown.js'

function createEditor() {
  return createHeadlessEditor({
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  })
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

// These tests guard the behavior that originally motivated dropping Payload's
// vendored @lexical/markdown fork: hard line breaks must survive markdown
// import (and round trip) even when adjacent lines are merged by default. The
// fix now lives in the upstream package (lexical 0.45, facebook/lexical#8402);
// these assert it still holds through Payload's wrapper.
describe('markdown hard line break import', () => {
  it('should import a trailing-space hard break as a line break node with the marker stripped', () => {
    const { hasLineBreak, textContent } = importMarkdown(['foo  ', 'bar'].join('\n'))

    expect(hasLineBreak).toBe(true)
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

  it('should round trip a hard break after formatted text', () => {
    const md = '**foo**  \nbar'
    expect(roundTrip(md)).toBe(md)
  })

  it('should round trip a hard break after a link', () => {
    const md = '[foo](https://payloadcms.com)  \nbar'
    expect(roundTrip(md)).toBe(md)
  })
})
