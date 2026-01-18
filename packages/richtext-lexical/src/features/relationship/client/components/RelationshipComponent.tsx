'use client'
import type { ElementFormatType } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { getTranslation } from '@ruya.sa/translations'
import { Button, useConfig, usePayloadAPI, useTranslation } from '@ruya.sa/ui'
import { $getNodeByKey } from 'lexical'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import React, { useCallback, useReducer, useRef, useState } from 'react'

import type { RelationshipData } from '../../server/nodes/RelationshipNode.js'

import './index.scss'
import { useLexicalDocumentDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from '../drawer/commands.js'

const initialParams = {
  depth: 0,
}

type Props = {
  className: string
  data: RelationshipData
  format?: ElementFormatType
  nodeKey?: string
}

export const RelationshipComponent: React.FC<Props> = (props) => {
  const {
    className: baseClass,
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
  const isEditable = useLexicalEditable()
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
    formatAdminURL({ apiRoute: api, path: `/${relatedCollection.slug}/${value}`, serverURL }),
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
    <div className={`${baseClass}__contents`} contentEditable={false} ref={relationshipElemRef}>
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
      {isEditable && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__swapButton`}
            disabled={!isEditable}
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
            disabled={!isEditable}
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
