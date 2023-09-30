import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  type LexicalEditor,
  createCommand,
} from 'lexical'
import { useListDrawer } from 'payload/components/elements'
import React, { useCallback, useEffect, useState } from 'react'

import { EnabledRelationshipsCondition } from '../../Relationship/utils/EnabledRelationshipsCondition'
import { $createUploadNode } from '../nodes/UploadNode'
import { INSERT_UPLOAD_COMMAND } from '../plugin'
import './index.scss'

const baseClass = 'lexical-upload-drawer'

export const INSERT_UPLOAD_WITH_DRAWER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false
}> = createCommand('INSERT_UPLOAD_WITH_DRAWER_COMMAND')

const insertUpload = ({
  id,
  editor,
  relationTo,
  replaceNodeKey,
}: {
  editor: LexicalEditor
  id: string
  relationTo: string
  replaceNodeKey: null | string
}) => {
  if (!replaceNodeKey) {
    editor.dispatchCommand(INSERT_UPLOAD_COMMAND, {
      id,
      relationTo,
    })
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey)
      if (node) {
        node.replace(
          $createUploadNode({
            fields: {
              relationTo,
              value: {
                id,
              },
            },
          }),
        )
      }
    })
  }
}

type Props = {
  enabledCollectionSlugs: string[]
}

const UploadDrawerComponent: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const [editor] = useLexicalComposerContext()

  const [replaceNodeKey, setReplaceNodeKey] = useState<null | string>(null)

  const [ListDrawer, ListDrawerToggler, { closeDrawer, openDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    uploads: true,
  })

  useEffect(() => {
    editor.registerCommand<{
      replace: { nodeKey: string } | false
    }>(
      INSERT_UPLOAD_WITH_DRAWER_COMMAND,
      (payload) => {
        setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null)
        openDrawer()
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, openDrawer])

  const onSelect = useCallback(
    ({ collectionConfig, docID }) => {
      insertUpload({
        id: docID,
        editor,
        relationTo: collectionConfig.slug,
        replaceNodeKey,
      })
      closeDrawer()
    },
    [editor, closeDrawer, replaceNodeKey],
  )

  return <ListDrawer onSelect={onSelect} />
}

export const UploadDrawer = (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props} uploads>
      <UploadDrawerComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
