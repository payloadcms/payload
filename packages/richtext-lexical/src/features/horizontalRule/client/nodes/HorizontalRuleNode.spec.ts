import { describe, expect, it } from 'vitest'

import { createEditor } from 'lexical'

import { $isHorizontalRuleNode, HorizontalRuleNode } from './HorizontalRuleNode.js'

describe('HorizontalRuleNode', () => {
  it('should create a client HorizontalRuleNode when pasting an <hr> element', () => {
    // lexical routes errors thrown inside editor.update to onError instead of rethrowing,
    // so capture them to assert the paste does not throw
    const errors: unknown[] = []
    const editor = createEditor({
      nodes: [HorizontalRuleNode],
      onError: (error) => {
        errors.push(error)
      },
    })

    let createdNode: unknown
    editor.update(() => {
      const importMap = HorizontalRuleNode.importDOM()
      expect(importMap).not.toBeNull()

      const hrEntry = importMap!['hr']
      expect(hrEntry).toBeDefined()

      // lexical's HTML importer calls the map entry with the pasted DOM element, then
      // calls the returned conversion with it as well
      const fakeHrElement = {} as unknown as HTMLElement
      const domConversion = hrEntry!(fakeHrElement)
      expect(domConversion).not.toBeNull()

      createdNode = domConversion!.conversion(fakeHrElement)?.node
    })

    // Pasting an <hr> must not trip lexical's node class identity check
    // ("Create node: Type horizontalrule in node HorizontalRuleServerNode does not match
    // registered node HorizontalRuleNode with the same type")
    expect(errors).toEqual([])

    // ...and must produce the client node class the editor registered for 'horizontalrule'
    expect($isHorizontalRuleNode(createdNode)).toBe(true)
    expect((createdNode as object).constructor).toBe(HorizontalRuleNode)
  })
})
