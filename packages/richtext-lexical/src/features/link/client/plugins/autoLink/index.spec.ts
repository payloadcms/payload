import { createHeadlessEditor } from '@lexical/headless'
import { $createParagraphNode, $createTextNode, $getRoot, TextNode } from 'lexical'
import { describe, expect, it } from 'vitest'

import { AutoLinkNode } from '../../../nodes/AutoLinkNode.js'
import { LinkNode } from '../../../nodes/LinkNode.js'
import { MATCHERS, registerAutoLinkTransform } from './index.js'

function createEditor() {
  return createHeadlessEditor({ nodes: [TextNode, LinkNode, AutoLinkNode] })
}

describe('registerAutoLinkTransform', () => {
  it('does not hang when a formatted auto-linkable node follows a text node ending in non-ASCII punctuation', () => {
    // Regression test for an infinite transform loop: a paragraph made of two text nodes
    // where (a) the first ends in punctuation the separator check does not recognise (e.g.
    // full-width "：" used in CJK text) and (b) the second looks like an email/URL and carries
    // a non-zero text format (bold, italic, etc). Before the fix, `$createAutoLinkNode_`'s
    // multi-node branch re-walked `nodes` (including the already-handled first node) with an
    // offset that assumed it had been skipped, corrupting the tree (the first node ended up
    // appended into the very AutoLinkNode that was about to replace it) and leaving the editor
    // stuck forever inside Lexical's transform-then-reconcile loop.
    const editor = createEditor()
    const unregister = registerAutoLinkTransform(editor, MATCHERS)

    const update = () => {
      editor.update(
        () => {
          const paragraph = $createParagraphNode()
          const leadingText = $createTextNode('有意者请将简历发送至：')
          const emailText = $createTextNode('someone@example.com')
          emailText.setFormat('bold')
          emailText.toggleFormat('italic')
          paragraph.append(leadingText, emailText)
          $getRoot().append(paragraph)
        },
        { discrete: true },
      )
    }

    expect(update).not.toThrow()

    unregister()
  }, 5_000)
})
