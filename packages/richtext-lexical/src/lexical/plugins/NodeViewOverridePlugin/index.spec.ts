// @vitest-environment jsdom

import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  HISTORY_MERGE_TAG,
  ParagraphNode,
} from 'lexical'
import { describe, expect, it } from 'vitest'

import { $createBlockNode, BlockNode } from '../../../features/blocks/client/nodes/BlocksNode.js'
import {
  $createInlineBlockNode,
  InlineBlockNode,
} from '../../../features/blocks/client/nodes/InlineBlocksNode.js'
import { refreshBlockDecorators } from './index.js'

describe('refreshBlockDecorators', () => {
  it('should mark existing block and inline block decorators dirty with the history merge tag', async () => {
    const editor = createEditor({
      namespace: 'node-view-override-plugin-test',
      nodes: [BlockNode, InlineBlockNode, ParagraphNode],
      onError: (error) => {
        throw error
      },
    })
    const rootElement = document.createElement('div')
    document.body.append(rootElement)
    editor.setRootElement(rootElement)
    let blockKey = ''
    let inlineBlockKey = ''

    editor.update(
      () => {
        const block = $createBlockNode({
          blockName: '',
          blockType: 'testBlock',
        })
        blockKey = block.getKey()
        const inlineBlock = $createInlineBlockNode({
          blockName: '',
          blockType: 'testInlineBlock',
        })
        inlineBlockKey = inlineBlock.getKey()
        const paragraph = $createParagraphNode().append(inlineBlock)
        $getRoot().append(block, paragraph)
      },
      { discrete: true },
    )

    const updateTags = new Promise<Set<string>>((resolve) => {
      editor.registerUpdateListener(({ dirtyLeaves, tags }) => {
        if (dirtyLeaves.has(blockKey) && dirtyLeaves.has(inlineBlockKey)) {
          resolve(tags)
        }
      })
    })

    refreshBlockDecorators(editor)

    await expect(updateTags).resolves.toContain(HISTORY_MERGE_TAG)
  })
})
