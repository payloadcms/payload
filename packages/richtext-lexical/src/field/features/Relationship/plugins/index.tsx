'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  createCommand,
} from 'lexical'
import { useConfig } from 'payload/components/utilities'
import { useEffect } from 'react'
import React from 'react'

import type { RelationshipFeatureProps } from '../index'
import type { RelationshipData } from '../nodes/RelationshipNode'

import { RelationshipDrawer } from '../drawer'
import { $createRelationshipNode, RelationshipNode } from '../nodes/RelationshipNode'

export const INSERT_RELATIONSHIP_COMMAND: LexicalCommand<RelationshipData> = createCommand(
  'INSERT_RELATIONSHIP_COMMAND',
)

export function RelationshipPlugin(props?: RelationshipFeatureProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const { collections } = useConfig()

  let enabledRelations: string[] = null

  if (props?.enabledCollections) {
    enabledRelations = props?.enabledCollections
  } else if (props?.disabledCollections) {
    enabledRelations = collections
      .filter(({ slug }) => !(props?.disabledCollections).includes(slug))
      .map(({ slug }) => slug)
  }

  useEffect(() => {
    if (!editor.hasNodes([RelationshipNode])) {
      throw new Error('RelationshipPlugin: RelationshipNode not registered on editor')
    }

    return editor.registerCommand<RelationshipData>(
      INSERT_RELATIONSHIP_COMMAND,
      (payload) => {
        const selection = $getSelection() || $getPreviousSelection()

        if ($isRangeSelection(selection)) {
          const relationshipNode = $createRelationshipNode(payload)
          $insertNodeToNearestRoot(relationshipNode)

          const { focus } = selection
          const focusNode = focus.getNode()

          // First, delete currently selected node if it's an empty paragraph and if there are sufficient
          // paragraph nodes (more than 1) left in the parent node, so that we don't "trap" the user
          if (
            $isParagraphNode(focusNode) &&
            focusNode.getTextContentSize() === 0 &&
            focusNode
              .getParent()
              .getChildren()
              .filter((node) => $isParagraphNode(node)).length > 1
          ) {
            focusNode.remove()
          }
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return <RelationshipDrawer enabledCollectionSlugs={enabledRelations} />
}
