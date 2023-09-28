import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  type LexicalEditor,
  createCommand,
} from 'lexical'
import { useListDrawer } from 'payload/components/elements'
import React, { useCallback, useEffect, useState } from 'react'

import type { RelationshipFields } from '../nodes/RelationshipNode'

import { INSERT_RELATIONSHIP_COMMAND } from '../plugins'
import { EnabledRelationshipsCondition } from '../utils/EnabledRelationshipsCondition'
import './index.scss'

const baseClass = 'lexical-relationship-drawer'

export const INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND: LexicalCommand<null> = createCommand(
  'INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND',
)

const insertRelationship = ({
  id,
  editor,
  relationTo,
}: {
  editor: LexicalEditor
  id: string
  relationTo: string
}) => {
  editor.dispatchCommand(INSERT_RELATIONSHIP_COMMAND, {
    id,
    data: null,
    relationTo,
  })
}

type Props = {
  enabledCollectionSlugs: string[]
}

const RelationshipDrawerComponent: React.FC<Props> = ({ enabledCollectionSlugs }) => {
  const [editor] = useLexicalComposerContext()
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState(
    () => enabledCollectionSlugs[0],
  )
  const [ListDrawer, ListDrawerToggler, { closeDrawer, isDrawerOpen, openDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: selectedCollectionSlug,
  })

  useEffect(() => {
    editor.registerCommand<RelationshipFields>(
      INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND,
      (payload) => {
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
      })
      closeDrawer()
    },
    [editor, closeDrawer],
  )

  useEffect(() => {
    // always reset back to first option
    // TODO: this is not working, see the ListDrawer component
    setSelectedCollectionSlug(enabledCollectionSlugs[0])
  }, [isDrawerOpen, enabledCollectionSlugs])

  return <ListDrawer onSelect={onSelect} />
}

export const RelationshipDrawer = (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipDrawerComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
