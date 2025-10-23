'use client'

import type { ListDrawerProps } from '@payloadcms/ui'

import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  useConfig,
  useDocumentDrawer,
  useListDrawer,
  usePayloadAPI,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useReducer, useState } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react'

import type { RelationshipElementType } from '../types.js'

import { useElement } from '../../../providers/ElementProvider.js'
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js'
import './index.scss'

const baseClass = 'rich-text-relationship'

const initialParams = {
  depth: 0,
}

const RelationshipElementComponent: React.FC = () => {
  const {
    attributes,
    children,
    element,
    element: { relationTo, value },
    fieldProps,
  } = useElement<RelationshipElementType>()

  const {
    config: {
      collections,
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()
  const [enabledCollectionSlugs] = useState(() =>
    collections
      .filter(({ admin: { enableRichTextRelationship } }) => enableRichTextRelationship)
      .map(({ slug }) => slug),
  )
  const [relatedCollection, setRelatedCollection] = useState(() =>
    getEntityConfig({ collectionSlug: relationTo }),
  )

  const selected = useSelected()
  const focused = useFocused()
  const { i18n, t } = useTranslation()
  const editor = useSlateStatic()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  )

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: value?.id,
    collectionSlug: relatedCollection.slug,
  })

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: relatedCollection.slug,
  })

  const removeRelationship = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element)

    Transforms.removeNodes(editor, { at: elementPath })
  }, [editor, element])

  const updateRelationship = React.useCallback(
    ({ doc }) => {
      const elementPath = ReactEditor.findPath(editor, element)

      Transforms.setNodes(
        editor,
        {
          type: 'relationship',
          children: [{ text: ' ' }],
          relationTo: relatedCollection.slug,
          value: { id: doc.id },
        },
        { at: elementPath },
      )

      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      closeDrawer()
      dispatchCacheBust()
    },
    [editor, element, relatedCollection, cacheBust, setParams, closeDrawer],
  )

  const swapRelationship = useCallback<NonNullable<ListDrawerProps['onSelect']>>(
    ({ collectionSlug, doc }) => {
      const elementPath = ReactEditor.findPath(editor, element)

      Transforms.setNodes(
        editor,
        {
          type: 'relationship',
          children: [{ text: ' ' }],
          relationTo: collectionSlug,
          value: { id: doc.id },
        },
        { at: elementPath },
      )

      setRelatedCollection(getEntityConfig({ collectionSlug }))

      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      closeListDrawer()
      dispatchCacheBust()
    },
    [closeListDrawer, editor, element, cacheBust, setParams, getEntityConfig],
  )

  return (
    <div
      className={[baseClass, selected && focused && `${baseClass}--selected`]
        .filter(Boolean)
        .join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__wrap`}>
        <p className={`${baseClass}__label`}>
          {t('fields:labelRelationship', {
            label: getTranslation(relatedCollection.labels.singular, i18n),
          })}
        </p>
        <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
          <p className={`${baseClass}__title`}>
            {data[relatedCollection?.admin?.useAsTitle || 'id']}
          </p>
        </DocumentDrawerToggler>
      </div>
      <div className={`${baseClass}__actions`}>
        <ListDrawerToggler
          className={`${baseClass}__list-drawer-toggler`}
          disabled={fieldProps?.field?.admin?.readOnly}
        >
          <Button
            buttonStyle="icon-label"
            disabled={fieldProps?.field?.admin?.readOnly}
            el="div"
            icon="swap"
            onClick={() => {
              // do nothing
            }}
            round
            tooltip={t('fields:swapRelationship')}
          />
        </ListDrawerToggler>
        <Button
          buttonStyle="icon-label"
          className={`${baseClass}__removeButton`}
          disabled={fieldProps?.field?.admin?.readOnly}
          icon="x"
          onClick={(e) => {
            e.preventDefault()
            removeRelationship()
          }}
          round
          tooltip={t('fields:removeRelationship')}
        />
      </div>
      {value?.id && <DocumentDrawer onSave={updateRelationship} />}
      <ListDrawer onSelect={swapRelationship} />
      {children}
    </div>
  )
}

export const RelationshipElement = (props: any): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props}>
      <RelationshipElementComponent {...props} />
    </EnabledRelationshipsCondition>
  )
}
