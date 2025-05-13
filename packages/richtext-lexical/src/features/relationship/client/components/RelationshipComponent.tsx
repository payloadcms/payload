'use client'
import type { ElementFormatType } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { getTranslation } from '@payloadcms/translations'
import { Button, useConfig, usePayloadAPI, useTranslation } from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { useCallback, useReducer, useRef, useState } from 'react'

import type { RelationshipData } from '../../server/nodes/RelationshipNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDocumentDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from '../drawer/commands.js'
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
    data: { relationTo, value },
    nodeKey,
  } = props

  if (typeof value === 'object') {
    throw new Error(
      'Relationship value should be a string or number. The Lexical Relationship component should not receive the populated value object.',
    )
  }

  const relationshipElemRef = useRef<HTMLDivElement | null>(null)

  const [editor] = useLexicalComposerContext()
  const {
    fieldProps: { readOnly },
  } = useEditorConfigContext()
  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const [relatedCollection] = useState(() => getEntityConfig({ collectionSlug: relationTo }))

  const { i18n, t } = useTranslation()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value}`,
    { initialParams },
  )

  const { closeDocumentDrawer, DocumentDrawer, DocumentDrawerToggler } = useLexicalDocumentDrawer({
    id: value,
    collectionSlug: relatedCollection.slug,
  })

  const removeRelationship = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey!)?.remove()
    })
  }, [editor, nodeKey])

  const updateRelationship = React.useCallback(() => {
    setParams({
      ...initialParams,
      cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
    })

    closeDocumentDrawer()
    dispatchCacheBust()
  }, [cacheBust, setParams, closeDocumentDrawer])

  return (
    <div className={baseClass} contentEditable={false} ref={relationshipElemRef}>
      <div className={`${baseClass}__wrap`}>
        <p className={`${baseClass}__label`}>
          {t('fields:labelRelationship', {
            label: relatedCollection.labels?.singular
              ? getTranslation(relatedCollection.labels?.singular, i18n)
              : relatedCollection.slug,
          })}
        </p>
        <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
          <p className={`${baseClass}__title`}>
            {data ? data[relatedCollection?.admin?.useAsTitle || 'id'] : value}
          </p>
        </DocumentDrawerToggler>
      </div>
      {editor.isEditable() && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__swapButton`}
            disabled={readOnly}
            el="button"
            icon="swap"
            onClick={() => {
              if (nodeKey) {
                editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                  replace: { nodeKey },
                })
              }
            }}
            round
            tooltip={t('fields:swapRelationship')}
          />
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__removeButton`}
            disabled={readOnly}
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

      {!!value && <DocumentDrawer onSave={updateRelationship} />}
    </div>
  )
}

export const RelationshipComponent = (props: Props): React.ReactNode => {
  return <Component {...props} />
}
