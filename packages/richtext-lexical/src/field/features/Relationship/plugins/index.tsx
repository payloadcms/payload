'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR, type LexicalCommand, createCommand } from 'lexical'
import { useConfig } from 'payload/components/utilities'
import { useEffect } from 'react'
import React from 'react'

import type { RelationshipData } from '../nodes/RelationshipNode'

import { RelationshipDrawer } from '../drawer'
import { $createRelationshipNode, RelationshipNode } from '../nodes/RelationshipNode'

export const INSERT_RELATIONSHIP_COMMAND: LexicalCommand<RelationshipData> = createCommand(
  'INSERT_RELATIONSHIP_COMMAND',
)

export function RelationshipPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const { collections } = useConfig()

  useEffect(() => {
    if (!editor.hasNodes([RelationshipNode])) {
      throw new Error('RelationshipPlugin: RelationshipNode not registered on editor')
    }

    return editor.registerCommand<RelationshipData>(
      INSERT_RELATIONSHIP_COMMAND,
      (payload) => {
        const relationshipNode = $createRelationshipNode(payload)
        $insertNodeToNearestRoot(relationshipNode)

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return <RelationshipDrawer enabledCollectionSlugs={collections.map(({ slug }) => slug)} />
}
