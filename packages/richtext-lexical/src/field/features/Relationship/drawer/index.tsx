'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR, type LexicalEditor } from 'lexical'
import { useListDrawer } from 'payload/components/elements'
import React, { useCallback, useEffect, useState } from 'react'

import { $createRelationshipNode } from '../nodes/RelationshipNode'
import { INSERT_RELATIONSHIP_COMMAND } from '../plugins'
import { EnabledRelationshipsCondition } from '../utils/EnabledRelationshipsCondition'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './commands'

const insertRelationship = ({
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
    editor.dispatchCommand(INSERT_RELATIONSHIP_COMMAND, {
      relationTo,
      value: {
        id,
      },
    })
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey)
      if (node) {
        node.replace($createRelationshipNode({ relationTo, value: { id } }))
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
    () => enabledCollectionSlugs[0],
  )
  const [replaceNodeKey, setReplaceNodeKey] = useState<null | string>(null)

  const [ListDrawer, ListDrawerToggler, { closeDrawer, isDrawerOpen, openDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: selectedCollectionSlug,
  })

  useEffect(() => {
    return editor.registerCommand<{
      replace: { nodeKey: string } | false
    }>(
      INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND,
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
      insertRelationship({
        id: docID,
        editor,
        relationTo: collectionConfig.slug,
        replaceNodeKey,
      })
      closeDrawer()
    },
    [editor, closeDrawer, replaceNodeKey],
  )

  useEffect(() => {
    // always reset back to first option
    // TODO: this is not working, see the ListDrawer component
    setSelectedCollectionSlug(enabledCollectionSlugs[0])
  }, [isDrawerOpen, enabledCollectionSlugs])

  return <ListDrawer onSelect={onSelect} />
}

export const RelationshipDrawer = (props: Props): React.ReactNode => {
  return props?.enabledCollectionSlugs?.length > 0 ? ( // If enabledCollectionSlugs it overrides what EnabledRelationshipsCondition is doing
    <RelationshipDrawerComponent {...props} />
  ) : (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipDrawerComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
