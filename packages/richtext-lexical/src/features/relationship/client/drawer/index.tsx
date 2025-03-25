'use client'
import type { ListDrawerProps } from '@payloadcms/ui'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR } from 'lexical'
import React, { useCallback, useEffect, useState } from 'react'

import { useLexicalListDrawer } from '../../../../utilities/fieldsDrawer/useLexicalListDrawer.js'
import { $createRelationshipNode } from '../nodes/RelationshipNode.js'
import { INSERT_RELATIONSHIP_COMMAND } from '../plugins/index.js'
import { EnabledRelationshipsCondition } from '../utils/EnabledRelationshipsCondition.js'
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
  enabledCollectionSlugs: null | string[]
}

const RelationshipDrawerComponent: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const [editor] = useLexicalComposerContext()
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState(
    () => enabledCollectionSlugs?.[0],
  )
  const [replaceNodeKey, setReplaceNodeKey] = useState<null | string>(null)

  const { closeListDrawer, isListDrawerOpen, ListDrawer, openListDrawer } = useLexicalListDrawer({
    collectionSlugs: enabledCollectionSlugs ? enabledCollectionSlugs : undefined,
    selectedCollection: selectedCollectionSlug,
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

export const RelationshipDrawer = (props: Props): React.ReactNode => {
  return (props?.enabledCollectionSlugs?.length ?? -1) > 0 ? ( // If enabledCollectionSlugs it overrides what EnabledRelationshipsCondition is doing
    <RelationshipDrawerComponent {...props} />
  ) : (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipDrawerComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
