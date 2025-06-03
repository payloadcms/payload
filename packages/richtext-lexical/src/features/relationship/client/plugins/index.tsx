'use client'
import type { LexicalCommand } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { useConfig } from '@payloadcms/ui'
import {
  $getPreviousSelection,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical'
import { useEffect } from 'react'

import type { PluginComponent } from '../../../typesClient.js'
import type { RelationshipFeatureProps } from '../../server/index.js'
import type { RelationshipData } from '../../server/nodes/RelationshipNode.js'

import { RelationshipDrawer } from '../drawer/index.js'
import { $createRelationshipNode, RelationshipNode } from '../nodes/RelationshipNode.js'

export const INSERT_RELATIONSHIP_COMMAND: LexicalCommand<RelationshipData> = createCommand(
  'INSERT_RELATIONSHIP_COMMAND',
)

export const RelationshipPlugin: PluginComponent<RelationshipFeatureProps> = ({ clientProps }) => {
  const [editor] = useLexicalComposerContext()
  const {
    config: { collections },
  } = useConfig()

  let enabledRelations: null | string[] = null

  if (clientProps?.enabledCollections) {
    enabledRelations = clientProps?.enabledCollections
  } else if (clientProps?.disabledCollections) {
    enabledRelations = collections
      .filter(({ slug }) => !clientProps?.disabledCollections?.includes(slug))
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
          // we need to get the focus node before inserting the block node, as $insertNodeToNearestRoot can change the focus node
          const { focus } = selection
          const focusNode = focus.getNode()
          // Insert relationship node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
          $insertNodeToNearestRoot(relationshipNode)

          // Delete the node it it's an empty paragraph
          if ($isParagraphNode(focusNode) && !focusNode.__first) {
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
