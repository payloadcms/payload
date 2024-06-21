'use client'
import type { LexicalCommand, LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import {
  BlocksDrawer,
  formatDrawerSlug,
  useEditDepth,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import React, { useCallback, useEffect, useState } from 'react'

import type { ClientComponentProps } from '../../types.js'
import type { BlocksFeatureClientProps } from '../feature.client.js'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import { $createBlockNode } from '../nodes/BlocksNode.js'
import { INSERT_BLOCK_COMMAND } from '../plugin/commands.js'
const baseClass = 'lexical-blocks-drawer'

export const INSERT_BLOCK_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_BLOCK_WITH_DRAWER_COMMAND')

const insertBlock = ({
  blockType,
  editor,
  replaceNodeKey,
}: {
  blockType: string
  editor: LexicalEditor
  replaceNodeKey: null | string
}) => {
  if (!replaceNodeKey) {
    editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
      id: null,
      blockName: '',
      blockType,
    })
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey)
      if (node) {
        node.replace(
          $createBlockNode({
            id: null,
            blockName: '',
            blockType,
          }),
        )
      }
    })
  }
}

export const BlocksDrawerComponent: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const { editorConfig, uuid } = useEditorConfigContext()

  const [replaceNodeKey, setReplaceNodeKey] = useState<null | string>(null)
  const editDepth = useEditDepth()
  const { t } = useTranslation()
  const { openModal } = useModal()

  const labels = {
    plural: t('fields:blocks') || 'Blocks',
    singular: t('fields:block') || 'Block',
  }

  const addRow = useCallback(
    (rowIndex: number, blockType: string) => {
      insertBlock({
        blockType,
        editor,
        replaceNodeKey,
      })
    },
    [editor, replaceNodeKey],
  )

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-rich-text-blocks-` + uuid,
    depth: editDepth,
  })

  const reducedBlocks = (
    editorConfig?.resolvedFeatureMap?.get('blocks')
      ?.sanitizedClientFeatureProps as ClientComponentProps<BlocksFeatureClientProps>
  )?.reducedBlocks

  useEffect(() => {
    return editor.registerCommand<{
      replace: { nodeKey: string } | false
    }>(
      INSERT_BLOCK_WITH_DRAWER_COMMAND,
      (payload) => {
        setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null)
        openModal(drawerSlug)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, drawerSlug, openModal])

  return (
    <BlocksDrawer
      addRow={addRow}
      addRowIndex={0}
      blocks={reducedBlocks}
      drawerSlug={drawerSlug}
      labels={labels}
    />
  )
}
