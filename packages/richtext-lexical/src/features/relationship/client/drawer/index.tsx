'use client'
import type { LexicalEditor } from 'lexical'
import type { CollectionSlug } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { type ListDrawerProps, toast } from '@payloadcms/ui'
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR } from 'lexical'
import React, { useCallback, useEffect, useState } from 'react'

import { useLexicalListDrawer } from '../../../../utilities/fieldsDrawer/useLexicalListDrawer.js'
import { $createRelationshipNode } from '../nodes/RelationshipNode.js'
import { INSERT_RELATIONSHIP_COMMAND } from '../plugins/index.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './commands.js'

const insertRelationship = ({
  editor,
  relationTo,
  replaceNodeKey,
  value,
}: {
  editor: LexicalEditor
  relationTo: string
  replaceNodeKey: null | string
  value: number | string
}) => {
  if (!replaceNodeKey) {
    editor.dispatchCommand(INSERT_RELATIONSHIP_COMMAND, {
      relationTo,
      value,
    })
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey)
      if (node) {
        node.replace($createRelationshipNode({ relationTo, value }))
      }
    })
  }
}

type Props = {
  enabledCollectionSlugs: CollectionSlug[]
}

const RelationshipDrawerComponent: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const [editor] = useLexicalComposerContext()

  const [replaceNodeKey, setReplaceNodeKey] = useState<null | string>(null)

  const { closeListDrawer, ListDrawer, openListDrawer } = useLexicalListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: enabledCollectionSlugs?.[0],
  })

  useEffect(() => {
    return editor.registerCommand<{
      replace: { nodeKey: string } | false
    }>(
      INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND,
      (payload) => {
        setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null)
        openListDrawer()
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, openListDrawer])

  const onSelect = useCallback<NonNullable<ListDrawerProps['onSelect']>>(
    ({ collectionSlug, doc }) => {
      insertRelationship({
        editor,
        relationTo: collectionSlug,
        replaceNodeKey,
        value: doc.id,
      })
      closeListDrawer()
    },
    [editor, closeListDrawer, replaceNodeKey],
  )

  return <ListDrawer onSelect={onSelect} />
}

const RelationshipDrawerComponentFallback: React.FC = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand<{
      replace: { nodeKey: string } | false
    }>(
      INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND,
      () => {
        toast.error('No relationship collections enabled')
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}

export const RelationshipDrawer = ({ enabledCollectionSlugs }: Props): React.ReactNode => {
  if (!enabledCollectionSlugs?.length) {
    return <RelationshipDrawerComponentFallback />
  }

  return <RelationshipDrawerComponent enabledCollectionSlugs={enabledCollectionSlugs} />
}
