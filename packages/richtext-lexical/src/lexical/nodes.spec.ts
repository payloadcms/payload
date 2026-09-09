import { createHeadlessEditor } from '@lexical/headless'
import { $copyNode, $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { describe, expect, it } from 'vitest'

import {
  $createServerBlockNode,
  ServerBlockNode,
} from '../features/blocks/server/nodes/BlocksNode.js'
import {
  $createServerInlineBlockNode,
  ServerInlineBlockNode,
} from '../features/blocks/server/nodes/InlineBlocksNode.js'
import {
  $createHorizontalRuleServerNode,
  HorizontalRuleServerNode,
} from '../features/horizontalRule/server/nodes/HorizontalRuleNode.js'
import { $createAutoLinkNode, AutoLinkNode } from '../features/link/nodes/AutoLinkNode.js'
import { $createLinkNode, LinkNode } from '../features/link/nodes/LinkNode.js'
import {
  $createServerRelationshipNode,
  RelationshipServerNode,
} from '../features/relationship/server/nodes/RelationshipNode.js'
import {
  $createUploadServerNode,
  UploadServerNode,
} from '../features/upload/server/nodes/UploadNode.js'

const nodes = [
  ServerBlockNode,
  ServerInlineBlockNode,
  HorizontalRuleServerNode,
  LinkNode,
  AutoLinkNode,
  RelationshipServerNode,
  UploadServerNode,
]

const cases = [
  {
    type: 'block',
    $createNode: () =>
      $createServerBlockNode({
        id: 'block-id',
        blockType: 'example',
        title: 'Block title',
      }).setFormat('center'),
  },
  {
    type: 'inlineBlock',
    $createNode: () =>
      $createServerInlineBlockNode({
        id: 'inline-id',
        blockType: 'example',
        title: 'Inline title',
      }),
  },
  { type: 'horizontalrule', $createNode: $createHorizontalRuleServerNode },
  {
    type: 'link',
    $createNode: () =>
      $createLinkNode({
        id: 'link-id',
        fields: { linkType: 'custom', newTab: true, url: 'https://payloadcms.com' },
      }).append($createTextNode('Payload')),
  },
  {
    type: 'autolink',
    $createNode: () =>
      $createAutoLinkNode({
        fields: { linkType: 'custom', newTab: false, url: 'https://payloadcms.com' },
      }).append($createTextNode('https://payloadcms.com')),
  },
  {
    type: 'relationship',
    $createNode: () =>
      $createServerRelationshipNode({ relationTo: 'posts', value: 'post-id' }).setFormat('right'),
  },
  {
    type: 'upload',
    $createNode: () =>
      $createUploadServerNode({
        data: {
          id: 'upload-id',
          fields: { caption: 'Image caption' },
          relationTo: 'media',
          value: 'media-id',
        },
      }).setFormat('center'),
  },
]

describe.each(cases)('Lexical compatibility: $type', ({ $createNode }) => {
  it('should preserve custom node data when parsing saved editor state', () => {
    const editor = createHeadlessEditor({ nodes })

    editor.update(
      () => {
        const node = $createNode()

        $getRoot().append(node.isInline() ? $createParagraphNode().append(node) : node)
      },
      { discrete: true },
    )

    const savedState = editor.getEditorState().toJSON()
    const restoredEditor = createHeadlessEditor({ nodes })

    restoredEditor.setEditorState(restoredEditor.parseEditorState(JSON.stringify(savedState)))

    expect(restoredEditor.getEditorState().toJSON()).toEqual(savedState)
  })

  it('should preserve custom properties and class when copying a node', () => {
    const editor = createHeadlessEditor({ nodes })

    editor.update(
      () => {
        const node = $createNode()
        const copy = $copyNode(node)

        expect(copy.constructor).toBe(node.constructor)
        expect(copy.getKey()).not.toBe(node.getKey())
        // Element children are copied separately by Lexical's tree traversal.
        expect(copy.exportJSON()).toEqual(node.exportJSON())
      },
      { discrete: true },
    )
  })
})
