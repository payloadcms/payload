'use client'
import type { ClientCollectionConfig } from 'payload/types'

import lexicalComposerContextImport from '@lexical/react/LexicalComposerContext.js'
const { useLexicalComposerContext } = lexicalComposerContextImport
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection.js'
import { getTranslation } from '@payloadcms/translations'
import lexicalImport from 'lexical'
const { $getNodeByKey } = lexicalImport

import { Button } from '@payloadcms/ui/elements/Button'
import { useDocumentDrawer } from '@payloadcms/ui/elements/DocumentDrawer'
import { DrawerToggler } from '@payloadcms/ui/elements/Drawer'
import { useDrawerSlug } from '@payloadcms/ui/elements/Drawer'
import { File } from '@payloadcms/ui/graphics/File'
import usePayloadAPI from '@payloadcms/ui/hooks/usePayloadAPI'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useCallback, useReducer, useState } from 'react'

import type { ClientComponentProps } from '../../types.js'
import type { UploadFeaturePropsClient } from '../feature.client.js'
import type { UploadData } from '../nodes/UploadNode.js'

import { useEditorConfigContext } from '../../../lexical/config/client/EditorConfigProvider.js'
import { EnabledRelationshipsCondition } from '../../relationship/utils/EnabledRelationshipsCondition.js'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from '../drawer/commands.js'
import { ExtraFieldsUploadDrawer } from './ExtraFieldsDrawer/index.js'
import './index.scss'

const baseClass = 'lexical-upload'

const initialParams = {
  depth: 0,
}

export type ElementProps = {
  data: UploadData
  nodeKey: string
  //uploadProps: UploadFeatureProps
}

const Component: React.FC<ElementProps> = (props) => {
  const {
    data: { fields, relationTo, value },
    nodeKey,
  } = props

  const {
    collections,
    routes: { api },
    serverURL,
  } = useConfig()

  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { editorConfig, field } = useEditorConfigContext()

  const { i18n, t } = useTranslation()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [relatedCollection, setRelatedCollection] = useState<ClientCollectionConfig>(() =>
    collections.find((coll) => coll.slug === relationTo),
  )

  const drawerSlug = useDrawerSlug('upload-drawer')

  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: value,
    collectionSlug: relatedCollection.slug,
  })

  // Get the referenced document
  const [{ data }, { setParams }] = usePayloadAPI(
    `${serverURL}${api}/${relatedCollection.slug}/${value}`,
    { initialParams },
  )

  const thumbnailSRC = data?.thumbnailURL || data?.url

  const removeUpload = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey).remove()
    })
  }, [editor, nodeKey])

  const updateUpload = useCallback(
    (json) => {
      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      dispatchCacheBust()
      closeDrawer()
    },
    [setParams, cacheBust, closeDrawer],
  )

  const hasExtraFields = (
    editorConfig?.resolvedFeatureMap?.get('upload')
      ?.clientFeatureProps as ClientComponentProps<UploadFeaturePropsClient>
  ).collections?.[relatedCollection.slug]?.hasExtraFields

  return (
    <div
      className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
      contentEditable={false}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__topRow`}>
          {/* TODO: migrate to use @payloadcms/ui/elements/Thumbnail component */}
          <div className={`${baseClass}__thumbnail`}>
            {thumbnailSRC ? <img alt={data?.filename} src={thumbnailSRC} /> : <File />}
          </div>
          <div className={`${baseClass}__topRowRightPanel`}>
            <div className={`${baseClass}__collectionLabel`}>
              {getTranslation(relatedCollection.labels.singular, i18n)}
            </div>
            {editor.isEditable() && (
              <div className={`${baseClass}__actions`}>
                {hasExtraFields ? (
                  <DrawerToggler
                    className={`${baseClass}__upload-drawer-toggler`}
                    disabled={field?.readOnly}
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
                ) : null}

                <Button
                  buttonStyle="icon-label"
                  disabled={field?.readOnly}
                  el="div"
                  icon="swap"
                  onClick={() => {
                    editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                      replace: { nodeKey },
                    })
                  }}
                  round
                  tooltip={t('fields:swapUpload')}
                />
                <Button
                  buttonStyle="icon-label"
                  className={`${baseClass}__removeButton`}
                  disabled={field?.readOnly}
                  icon="x"
                  onClick={(e) => {
                    e.preventDefault()
                    removeUpload()
                  }}
                  round
                  tooltip={t('fields:removeUpload')}
                />
              </div>
            )}
          </div>
        </div>
        <div className={`${baseClass}__bottomRow`}>
          <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
            <strong>{data?.filename}</strong>
          </DocumentDrawerToggler>
        </div>
      </div>
      {value && <DocumentDrawer onSave={updateUpload} />}
      {hasExtraFields ? (
        <ExtraFieldsUploadDrawer
          drawerSlug={drawerSlug}
          relatedCollection={relatedCollection}
          {...props}
        />
      ) : null}
    </div>
  )
}

export const UploadComponent = (props: ElementProps): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition {...props} uploads>
      <Component {...props} />
    </EnabledRelationshipsCondition>
  )
}
