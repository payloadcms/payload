import { createHeadlessEditor } from '@lexical/headless'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'

import { AutoLinkNode } from './AutoLinkNode.js'
import { $createLinkNode, LinkNode } from './LinkNode.js'

function createEditor() {
  return createHeadlessEditor({ nodes: [LinkNode, AutoLinkNode] })
}

describe('LinkNode', () => {
  describe('exportJSON', () => {
    it('should always include a non-empty string id', () => {
      const editor = createEditor()

      let exportedId: string | undefined

      editor.update(
        () => {
          const link = $createLinkNode({
            fields: { linkType: 'custom', url: 'https://payloadcms.com', newTab: false, doc: null },
          })
          link.append($createTextNode('Payload'))
          $getRoot().append($createParagraphNode().append(link))

          const serialized = link.exportJSON()
          exportedId = serialized.id
        },
        { discrete: true },
      )

      expect(exportedId).toBeDefined()
      expect(typeof exportedId).toBe('string')
      expect(exportedId!.length).toBeGreaterThan(0)
    })
  })

  describe('importJSON', () => {
    it('should assign a new id when importing a v2 node with no id', () => {
      const editor = createEditor()

      let importedId: string | undefined

      editor.update(
        () => {
          const serializedV2 = {
            type: 'link' as const,
            version: 2,
            id: '',
            fields: { linkType: 'custom' as const, url: 'https://payloadcms.com', newTab: false },
            children: [],
            direction: null,
            format: '' as const,
            indent: 0,
          }

          const node = LinkNode.importJSON(serializedV2)
          $getRoot().append($createParagraphNode().append(node))

          importedId = node.getID()
        },
        { discrete: true },
      )

      expect(importedId).toBeDefined()
      expect(typeof importedId).toBe('string')
      expect(importedId!.length).toBeGreaterThan(0)
    })

    it('should preserve the existing id when importing a v3 node', () => {
      const editor = createEditor()

      const existingId = 'abc123def456789012345678'
      let importedId: string | undefined

      editor.update(
        () => {
          const serializedV3 = {
            type: 'link' as const,
            version: 3,
            id: existingId,
            fields: { linkType: 'custom' as const, url: 'https://payloadcms.com', newTab: false },
            children: [],
            direction: null,
            format: '' as const,
            indent: 0,
          }

          const node = LinkNode.importJSON(serializedV3)
          $getRoot().append($createParagraphNode().append(node))

          importedId = node.getID()
        },
        { discrete: true },
      )

      expect(importedId).toBe(existingId)
    })
  })
})
