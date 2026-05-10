import { createHeadlessEditor } from '@lexical/headless'
import {
  $createHorizontalRuleNode as $createLexicalHorizontalRuleNode,
  HorizontalRuleNode as LexicalHorizontalRuleNode,
} from '../../../../lexical-proxy/@lexical-react/LexicalHorizontalRuleNode.js'
import { describe, expect, it } from 'vitest'

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from './HorizontalRuleNode.js'

describe('HorizontalRuleNode client export', () => {
  it('should use the same HorizontalRuleNode class as lexical', () => {
    expect(HorizontalRuleNode).toBe(LexicalHorizontalRuleNode)
  })

  it('should create nodes that match lexical class identity', () => {
    const editor = createHeadlessEditor({
      nodes: [HorizontalRuleNode],
    })

    editor.update(
      () => {
        const node = $createHorizontalRuleNode()
        const lexicalNode = $createLexicalHorizontalRuleNode()

        expect(node.constructor).toBe(lexicalNode.constructor)
        expect($isHorizontalRuleNode(node)).toBe(true)
      },
      { discrete: true },
    )
  })
})
