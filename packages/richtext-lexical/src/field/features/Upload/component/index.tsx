import type { SanitizedCollectionConfig } from 'payload/types'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { $getNodeByKey } from 'lexical'
import { Button } from 'payload/components'
import {
  DrawerToggler,
  useDocumentDrawer,
  useDrawerSlug,
  useListDrawer,
} from 'payload/components/elements'
import { FileGraphic } from 'payload/components/graphics'
import { usePayloadAPI, useThumbnail } from 'payload/components/hooks'
import { useConfig } from 'payload/components/utilities'
import { getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { UploadFeatureProps } from '..'
import type { UploadFields } from '../nodes/UploadNode'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
import { EnabledRelationshipsCondition } from '../../Relationship/utils/EnabledRelationshipsCondition'
import { UploadDrawer } from './UploadDrawer'
import './index.scss'

const baseClass = 'lexical-upload'

const initialParams = {
  depth: 0,
}

export type ElementProps = {
  fields: UploadFields
  nodeKey: string
  //uploadProps: UploadFeatureProps
}

const Element: React.FC<ElementProps> = (props) => {
  const {
    fields: { relationTo, value },
    nodeKey,
  } = props

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { field } = useEditorConfigContext()

  const { i18n, t } = useTranslation('fields')
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [relatedCollection, setRelatedCollection] = useState<SanitizedCollectionConfig>(() =>
    collections.find((coll) => coll.slug === relationTo),
  )

  const drawerSlug = useDrawerSlug('upload-drawer')

  const [ListDrawer, ListDrawerToggler, { closeDrawer: closeListDrawer, openDrawer }] =
    useListDrawer({
      // collectionSlugs: enabledCollectionSlugs, // TODO
      collectionSlugs: collections.map((coll) => coll.slug),
      selectedCollection: relatedCollection.slug,
    })

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: value?.id,
    collectionSlug: relatedCollection.slug,
  })

  // Get the referenced document
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value?.id}`,
    { initialParams },
  )

  const thumbnailSRC = useThumbnail(relatedCollection, data)

  const removeUpload = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const updateUpload = useCallback(
    (json) => {
      const { doc } = json

      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      dispatchCacheBust()
      closeDrawer()
    },
    [setParams, cacheBust, closeDrawer],
  )

  const swapUpload = React.useCallback(
    ({ collectionConfig, docID }) => {
      const newNode = {
        children: [{ text: ' ' }],
        relationTo: collectionConfig.slug,
        type: 'upload',
        value: { id: docID },
      }

      // TODO:
      //const elementPath = ReactEditor.findPath(editor, element)

      setRelatedCollection(collections.find((coll) => coll.slug === collectionConfig.slug))

      ////Transforms.setNodes(editor, newNode, { at: elementPath })

      dispatchCacheBust()
      closeListDrawer()
    },
    [closeListDrawer, editor, collections],
  )

  // TODO
  //const customFields = field?.admin?.upload?.collections?.[relatedCollection.slug]?.fields

  return (
    <div
      className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
      contentEditable={false}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__topRow`}>
          <div className={`${baseClass}__thumbnail`}>
            {thumbnailSRC ? <img alt={data?.filename} src={thumbnailSRC} /> : <FileGraphic />}
          </div>
          <div className={`${baseClass}__topRowRightPanel`}>
            <div className={`${baseClass}__collectionLabel`}>
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </div>
            <div className={`${baseClass}__actions`}>
              {
                /* TODO customFields?.length > 0 && (
                <DrawerToggler
                  className={`${baseClass}__upload-drawer-toggler`}
                  disabled={field?.admin?.readOnly}
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
                  )*/ <div />
              }
              <ListDrawerToggler
                className={`${baseClass}__list-drawer-toggler`}
                disabled={field?.admin?.readOnly}
              >
                <Button
                  buttonStyle="icon-label"
                  disabled={field?.admin?.readOnly}
                  el="div"
                  icon="swap"
                  onClick={() => {
                    // do nothing
                  }}
                  round
                  tooltip={t('swapUpload')}
                />
              </ListDrawerToggler>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__removeButton`}
                disabled={field?.admin?.readOnly}
                icon="x"
                onClick={(e) => {
                  e.preventDefault()
                  removeUpload()
                }}
                round
                tooltip={t('removeUpload')}
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
      {value?.id && <DocumentDrawer onSave={updateUpload} />}
      <ListDrawer onSelect={swapUpload} />
      <UploadDrawer drawerSlug={drawerSlug} relatedCollection={relatedCollection} {...props} />
    </div>
  )
}

export default (props: ElementProps): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props} uploads>
      <Element {...props} />
    </EnabledRelationshipsCondition>
  )
}
