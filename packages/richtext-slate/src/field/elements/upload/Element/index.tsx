'use client'

import type { FormFieldBase } from '@payloadcms/ui/fields/shared'
import type { ClientCollectionConfig } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { Button } from '@payloadcms/ui/elements/Button'
import { useDocumentDrawer } from '@payloadcms/ui/elements/DocumentDrawer'
import { DrawerToggler, useDrawerSlug } from '@payloadcms/ui/elements/Drawer'
import { useListDrawer } from '@payloadcms/ui/elements/ListDrawer'
import { File } from '@payloadcms/ui/graphics/File'
import usePayloadAPI from '@payloadcms/ui/hooks/usePayloadAPI'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useCallback, useReducer, useState } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useFocused, useSelected, useSlateStatic } from 'slate-react'

import type { UploadElementType } from '../types.js'

import { useElement } from '../../../providers/ElementProvider.js'
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition.js'
import { uploadFieldsSchemaPath, uploadName } from '../shared.js'
import { UploadDrawer } from './UploadDrawer/index.js'
import './index.scss'

const baseClass = 'rich-text-upload'

const initialParams = {
  depth: 0,
}

type Props = FormFieldBase & {
  name: string
  richTextComponentMap: Map<string, React.ReactNode>
}

const UploadElement: React.FC<Props & { enabledCollectionSlugs?: string[] }> = ({
  enabledCollectionSlugs,
}) => {
  const {
    attributes,
    children,
    element: { relationTo, value },
    element,
    fieldProps,
    schemaPath,
  } = useElement<UploadElementType>()

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()
  const { i18n, t } = useTranslation()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [relatedCollection, setRelatedCollection] = useState<ClientCollectionConfig>(() =>
    collections.find((coll) => coll.slug === relationTo),
  )

  const drawerSlug = useDrawerSlug('upload-drawer')

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs: enabledCollectionSlugs,
    selectedCollection: relatedCollection.slug,
  })

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: value?.id,
    collectionSlug: relatedCollection.slug,
  })

  const editor = useSlateStatic()
  const selected = useSelected()
  const focused = useFocused()

  // Get the referenced document
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  )

  const thumbnailSRC = data?.thumbnailURL

  const removeUpload = useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element)

    Transforms.removeNodes(editor, { at: elementPath })
  }, [editor, element])

  const updateUpload = useCallback(
    (json) => {
      const { doc } = json

      const newNode = {
        fields: doc,
      }

      const elementPath = ReactEditor.findPath(editor, element)

      Transforms.setNodes(editor, newNode, { at: elementPath })

      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      dispatchCacheBust()
      closeDrawer()
    },
    [editor, element, setParams, cacheBust, closeDrawer],
  )

  const swapUpload = React.useCallback(
    ({ collectionSlug, docID }) => {
      const newNode = {
        type: uploadName,
        children: [{ text: ' ' }],
        relationTo: collectionSlug,
        value: { id: docID },
      }

      const elementPath = ReactEditor.findPath(editor, element)

      setRelatedCollection(collections.find((coll) => coll.slug === collectionSlug))

      Transforms.setNodes(editor, newNode, { at: elementPath })

      dispatchCacheBust()
      closeListDrawer()
    },
    [closeListDrawer, editor, element, collections],
  )

  const relatedFieldSchemaPath = `${uploadFieldsSchemaPath}.${relatedCollection.slug}`
  const customFieldsMap = fieldProps.richTextComponentMap.get(relatedFieldSchemaPath)

  return (
    <div
      className={[baseClass, selected && focused && `${baseClass}--selected`]
        .filter(Boolean)
        .join(' ')}
      contentEditable={false}
      {...attributes}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__topRow`}>
          {/* TODO: migrate to use Thumbnail component */}
          <div className={`${baseClass}__thumbnail`}>
            {thumbnailSRC ? <img alt={data?.filename} src={thumbnailSRC} /> : <File />}
          </div>
          <div className={`${baseClass}__topRowRightPanel`}>
            <div className={`${baseClass}__collectionLabel`}>
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </div>
            <div className={`${baseClass}__actions`}>
              {Boolean(customFieldsMap) && (
                <DrawerToggler
                  className={`${baseClass}__upload-drawer-toggler`}
                  disabled={fieldProps?.readOnly}
                  slug={drawerSlug}
                >
                  <Button
                    buttonStyle="icon-label"
                    el="div"
                    icon="edit"
                    onClick={(e) => {
                      e.preventDefault()
                    }}
                    round
                    tooltip={t('fields:editRelationship')}
                  />
                </DrawerToggler>
              )}
              <ListDrawerToggler
                className={`${baseClass}__list-drawer-toggler`}
                disabled={fieldProps?.readOnly}
              >
                <Button
                  buttonStyle="icon-label"
                  disabled={fieldProps?.readOnly}
                  el="div"
                  icon="swap"
                  onClick={() => {
                    // do nothing
                  }}
                  round
                  tooltip={t('fields:swapUpload')}
                />
              </ListDrawerToggler>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__removeButton`}
                disabled={fieldProps?.readOnly}
                icon="x"
                onClick={(e) => {
                  e.preventDefault()
                  removeUpload()
                }}
                round
                tooltip={t('fields:removeUpload')}
              />
            </div>
          </div>
        </div>
        <div className={`${baseClass}__bottomRow`}>
          <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
            <strong>{data?.filename}</strong>
          </DocumentDrawerToggler>
        </div>
      </div>
      {children}
      {value?.id && <DocumentDrawer onSave={updateUpload} />}
      <ListDrawer onSelect={swapUpload} />
      <UploadDrawer {...{ drawerSlug, element, fieldProps, relatedCollection, schemaPath }} />
    </div>
  )
}

export const Element = (props: Props): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props} uploads>
      <UploadElement {...props} />
    </EnabledRelationshipsCondition>
  )
}
