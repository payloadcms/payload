'use client'
import type { ElementFormatType } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js'
import { mergeRegister } from '@lexical/utils'
import { getTranslation } from '@payloadcms/translations'
import { Button, useConfig, useDocumentDrawer, usePayloadAPI, useTranslation } from '@payloadcms/ui'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'

import type { RelationshipData } from '../../server/nodes/RelationshipNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from '../drawer/commands.js'
import { $isRelationshipNode } from '../nodes/RelationshipNode.js'
import './index.scss'

const baseClass = 'lexical-relationship'

const initialParams = {
  depth: 0,
}

type Props = {
  className?: string
  data: RelationshipData
  format?: ElementFormatType
  nodeKey?: string
}

const Component: React.FC<Props> = (props) => {
  const {
    data: { relationTo, value: id },
    nodeKey,
  } = props

  const relationshipElemRef = useRef<HTMLDivElement | null>(null)

  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { field } = useEditorConfigContext()
  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [relatedCollection, setRelatedCollection] = useState(() =>
    collections.find((coll) => coll.slug === relationTo),
  )

  const { i18n, t } = useTranslation()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${id}`,
    { initialParams },
  )

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id,
    collectionSlug: relatedCollection.slug,
  })

  const removeRelationship = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const updateRelationship = React.useCallback(
    ({ doc }) => {
      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      closeDrawer()
      dispatchCacheBust()
    },
    [cacheBust, setParams, closeDrawer],
  )

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isRelationshipNode(node)) {
          node.remove()
          return true
        }
      }
      return false
    },
    [isSelected, nodeKey],
  )
  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      // Check if relationshipElemRef.target or anything WITHIN relationshipElemRef.target was clicked
      if (
        event.target === relationshipElemRef.current ||
        relationshipElemRef.current?.contains(event.target as Node)
      ) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          if (!isSelected) {
            clearSelection()
            setSelected(true)
          }
        }
        return true
      }

      return false
    },
    [isSelected, setSelected, clearSelection],
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    )
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected, onClick])

  return (
    <div
      className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
      contentEditable={false}
      ref={relationshipElemRef}
    >
      <div className={`${baseClass}__wrap`}>
        <p className={`${baseClass}__label`}>
          {t('fields:labelRelationship', {
            label: getTranslation(relatedCollection.labels.singular, i18n),
          })}
        </p>
        <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
          <p className={`${baseClass}__title`}>
            {data ? data[relatedCollection?.admin?.useAsTitle || 'id'] : id}
          </p>
        </DocumentDrawerToggler>
      </div>
      {editor.isEditable() && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__swapButton`}
            disabled={field?.admin?.readOnly}
            el="div"
            icon="swap"
            onClick={() => {
              editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                replace: { nodeKey },
              })
            }}
            round
            tooltip={t('fields:swapRelationship')}
          />
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__removeButton`}
            disabled={field?.admin?.readOnly}
            icon="x"
            onClick={(e) => {
              e.preventDefault()
              removeRelationship()
            }}
            round
            tooltip={t('fields:removeRelationship')}
          />
        </div>
      )}

      {id && <DocumentDrawer onSave={updateRelationship} />}
    </div>
  )
}

export const RelationshipComponent = (props: Props): React.ReactNode => {
  return <Component {...props} />
}
