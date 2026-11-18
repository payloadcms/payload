import { createHeadlessEditor } from '@lexical/headless'
import { describe, expect, it } from 'vitest'

import { HorizontalRuleNode } from './HorizontalRuleNode.js'

describe('HorizontalRuleNode.importDOM', () => {
  it('creates the registered client node when importing a pasted <hr>', () => {
    const editor = createHeadlessEditor({ nodes: [HorizontalRuleNode] })
    let importedNode: unknown

    editor.update(
      () => {
        const conversionMap = HorizontalRuleNode.importDOM()
        expect(conversionMap).not.toBeNull()

        const hrConversion = conversionMap!.hr!({} as HTMLElement)
        const output = hrConversion.conversion({} as HTMLElement)

        expect(output).not.toBeNull()
        importedNode = output!.node
      },
      { discrete: true },
    )

    expect(importedNode).toBeInstanceOf(HorizontalRuleNode)
  })
})
