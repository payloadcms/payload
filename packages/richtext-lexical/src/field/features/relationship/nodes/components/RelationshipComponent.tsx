'use client'
import lexicalComposerContextImport from '@lexical/react/LexicalComposerContext.js'
const { useLexicalComposerContext } = lexicalComposerContextImport
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js'
import { getTranslation } from '@payloadcms/translations'
import lexicalImport from 'lexical'
const { $getNodeByKey } = lexicalImport

import type { ElementFormatType } from 'lexical'

import { Button } from '@payloadcms/ui/elements/Button'
import { useDocumentDrawer } from '@payloadcms/ui/elements/DocumentDrawer'
import usePayloadAPI from '@payloadcms/ui/hooks/usePayloadAPI'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useCallback, useReducer, useState } from 'react'

import type { RelationshipData } from '../RelationshipNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from '../../drawer/commands.js'
import './index.scss'

const baseClass = 'lexical-relationship'

const initialParams = {
  depth: 0,
}

type Props = {
  children?: React.ReactNode
  className?: string
  data: RelationshipData
  format?: ElementFormatType
  nodeKey?: string
}

const Component: React.FC<Props> = (props) => {
  const {
    children,
    data: { relationTo, value: id },
    nodeKey,
  } = props

  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { field } = useEditorConfigContext()
  const {
    collections,
    routes: { api },
    serverURL,
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

  return (
    <div
      className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
      contentEditable={false}
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
            disabled={field?.readOnly}
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
            disabled={field?.readOnly}
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
      {children}
    </div>
  )
}

export const RelationshipComponent = (props: Props): React.ReactNode => {
  return <Component {...props} />
}
