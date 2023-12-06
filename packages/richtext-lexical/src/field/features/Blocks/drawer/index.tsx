'use client'
import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  type LexicalEditor,
  createCommand,
} from 'lexical'
import { formatDrawerSlug } from 'payload/components/elements'
import { BlocksDrawer } from 'payload/components/fields/Blocks'
import { useEditDepth } from 'payload/components/utilities'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BlocksFeatureProps } from '..'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
import { $createBlockNode } from '../nodes/BlocksNode'
import { INSERT_BLOCK_COMMAND } from '../plugin/commands'
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
      blockType: blockType,
    })
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey)
      if (node) {
        node.replace(
          $createBlockNode({
            id: null,
            blockName: '',
            blockType: blockType,
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
  const { t } = useTranslation('fields')
  const { openModal } = useModal()

  const labels = {
    plural: t('blocks') || 'Blocks',
    singular: t('block') || 'Block',
  }

  const addRow = useCallback(
    async (rowIndex: number, blockType: string) => {
      insertBlock({
        blockType: blockType,
        editor,
        replaceNodeKey,
      })
    },
    [editor, replaceNodeKey],
  )

  const drawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `lexical-rich-text-blocks-` + uuid,
  })

  const blocks = (editorConfig?.resolvedFeatureMap?.get('blocks')?.props as BlocksFeatureProps)
    ?.blocks

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
      blocks={blocks}
      drawerSlug={drawerSlug}
      labels={labels}
    />
  )
}
