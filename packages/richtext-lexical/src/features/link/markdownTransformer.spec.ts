import { createHeadlessEditor } from '@lexical/headless'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'

import { $convertToMarkdownString } from '../../packages/@lexical/markdown/index.js'
import { AutoLinkNode } from './nodes/AutoLinkNode.js'
import { $createLinkNode, LinkNode } from './nodes/LinkNode.js'
import type { SerializedLinkNode } from './nodes/types.js'
import { LinkMarkdownTransformer, createLinkMarkdownTransformer } from './markdownTransformer.js'

function createEditor() {
  return createHeadlessEditor({ nodes: [LinkNode, AutoLinkNode] })
}

function toMarkdown(setupFn: () => void, transformer = LinkMarkdownTransformer): string {
  const editor = createEditor()
  editor.update(setupFn, { discrete: true })
  let markdown = ''
  editor.getEditorState().read(() => {
    markdown = $convertToMarkdownString([transformer])
  })
  return markdown
}

describe('createLinkMarkdownTransformer', () => {
  describe('custom links', () => {
    it('should export a custom link with its url', () => {
      const markdown = toMarkdown(() => {
        const link = $createLinkNode({
          fields: { linkType: 'custom', url: 'https://payloadcms.com', newTab: false, doc: null },
        })
        link.append($createTextNode('Payload'))
        $getRoot().append($createParagraphNode().append(link))
      })

      expect(markdown).toBe('[Payload](https://payloadcms.com)')
    })

    it('should export a custom link that opens in a new tab', () => {
      // newTab is a Payload field — markdown has no equivalent, so it is intentionally dropped
      const markdown = toMarkdown(() => {
        const link = $createLinkNode({
          fields: { linkType: 'custom', url: 'https://payloadcms.com', newTab: true, doc: null },
        })
        link.append($createTextNode('Payload'))
        $getRoot().append($createParagraphNode().append(link))
      })

      expect(markdown).toBe('[Payload](https://payloadcms.com)')
    })

    it('should produce an empty href when url is null or undefined', () => {
      const markdownNull = toMarkdown(() => {
        const link = $createLinkNode({
          fields: { linkType: 'custom', url: null as unknown as string, newTab: false, doc: null },
        })
        link.append($createTextNode('Broken'))
        $getRoot().append($createParagraphNode().append(link))
      })

      const markdownUndefined = toMarkdown(() => {
        const link = $createLinkNode({
          fields: { linkType: 'custom', newTab: false, doc: null },
        })
        link.append($createTextNode('Broken'))
        $getRoot().append($createParagraphNode().append(link))
      })

      expect(markdownNull).toBe('[Broken]()')
      expect(markdownUndefined).toBe('[Broken]()')
    })
  })

  describe('internal links', () => {
    it('should export an empty href when no internalDocToHref is provided', () => {
      const markdown = toMarkdown(() => {
        const link = $createLinkNode({
          fields: {
            linkType: 'internal',
            doc: { relationTo: 'pages', value: { id: '1', slug: 'about' } },
            newTab: false,
          },
        })
        link.append($createTextNode('About'))
        $getRoot().append($createParagraphNode().append(link))
      })

      expect(markdown).toBe('[About]()')
    })

    it('should call internalDocToHref and use the returned url', () => {
      const transformer = createLinkMarkdownTransformer({
        internalDocToHref: ({ linkNode }) => {
          const value = linkNode.fields.doc?.value
          if (value && typeof value === 'object' && 'slug' in value) {
            return `/${value.slug}`
          }
          return '/'
        },
      })

      const markdown = toMarkdown(() => {
        const link = $createLinkNode({
          fields: {
            linkType: 'internal',
            doc: { relationTo: 'pages', value: { id: '1', slug: 'about' } },
            newTab: false,
          },
        })
        link.append($createTextNode('About'))
        $getRoot().append($createParagraphNode().append(link))
      }, transformer)

      expect(markdown).toBe('[About](/about)')
    })

    it('should pass the full serialized link node to internalDocToHref', () => {
      let capturedLinkNode: SerializedLinkNode | null = null

      const transformer = createLinkMarkdownTransformer({
        internalDocToHref: ({ linkNode }) => {
          capturedLinkNode = linkNode
          return '/captured'
        },
      })

      toMarkdown(() => {
        const link = $createLinkNode({
          fields: {
            linkType: 'internal',
            doc: { relationTo: 'pages', value: { id: '42', title: 'Home' } },
            newTab: true,
          },
        })
        link.append($createTextNode('Home'))
        $getRoot().append($createParagraphNode().append(link))
      }, transformer)

      expect(capturedLinkNode).not.toBeNull()
      expect(capturedLinkNode!.fields.linkType).toBe('internal')
      expect(capturedLinkNode!.fields.doc?.relationTo).toBe('pages')
      expect(capturedLinkNode!.fields.doc?.value).toMatchObject({ id: '42', title: 'Home' })
      expect(capturedLinkNode!.fields.newTab).toBe(true)
    })
  })

  describe('LinkMarkdownTransformer (static export)', () => {
    it('should behave identically to createLinkMarkdownTransformer() with no args', () => {
      const setup = () => {
        const link = $createLinkNode({
          fields: { linkType: 'custom', url: 'https://example.com', newTab: false, doc: null },
        })
        link.append($createTextNode('Example'))
        $getRoot().append($createParagraphNode().append(link))
      }

      const fromStatic = toMarkdown(setup, LinkMarkdownTransformer)
      const fromFactory = toMarkdown(setup, createLinkMarkdownTransformer())

      expect(fromStatic).toBe(fromFactory)
      expect(fromStatic).toBe('[Example](https://example.com)')
    })
  })
})
