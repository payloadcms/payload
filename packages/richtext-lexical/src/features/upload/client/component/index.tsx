'use client'
import type { ClientCollectionConfig, Data, FormState, JsonObject } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  formatDrawerSlug,
  Thumbnail,
  useConfig,
  useEditDepth,
  usePayloadAPI,
  useTranslation,
} from '@payloadcms/ui'
import { $getNodeByKey, type ElementFormatType } from 'lexical'
import { isImage } from 'payload/shared'
import React, { useCallback, useId, useReducer, useRef, useState } from 'react'

import type { BaseClientFeatureProps } from '../../../typesClient.js'
import type { UploadData } from '../../server/nodes/UploadNode.js'
import type { UploadFeaturePropsClient } from '../index.js'
import type { UploadNode } from '../nodes/UploadNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { FieldsDrawer } from '../../../../utilities/fieldsDrawer/Drawer.js'
import { useLexicalDocumentDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDocumentDrawer.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { EnabledRelationshipsCondition } from '../../../relationship/client/utils/EnabledRelationshipsCondition.js'
import './index.scss'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from '../drawer/commands.js'

const baseClass = 'lexical-upload'

const initialParams = {
  depth: 0,
}

export type ElementProps = {
  data: UploadData
  format?: ElementFormatType
  nodeKey: string
}

const Component: React.FC<ElementProps> = (props) => {
  const {
    data: { fields, relationTo, value },
    nodeKey,
  } = props

  if (typeof value === 'object') {
    throw new Error(
      'Upload value should be a string or number. The Lexical Upload component should not receive the populated value object.',
    )
  }

  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()
  const uploadRef = useRef<HTMLDivElement | null>(null)
  const { uuid } = useEditorConfigContext()
  const editDepth = useEditDepth()
  const [editor] = useLexicalComposerContext()

  const {
    editorConfig,
    fieldProps: { schemaPath },
  } = useEditorConfigContext()
  const isEditable = useLexicalEditable()
  const { i18n, t } = useTranslation()
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)
  const [relatedCollection] = useState<ClientCollectionConfig>(() =>
    getEntityConfig({ collectionSlug: relationTo }),
  )

  const componentID = useId()

  const extraFieldsDrawerSlug = formatDrawerSlug({
    slug: `lexical-upload-drawer-` + uuid + componentID, // There can be multiple upload components, each with their own drawer, in one single editor => separate them by componentID
    depth: editDepth,
  })

  // Need to use hook to initialize useEffect that restores cursor position
  const { toggleDrawer } = useLexicalDrawer(extraFieldsDrawerSlug, true)

  const { closeDocumentDrawer, DocumentDrawer, DocumentDrawerToggler } = useLexicalDocumentDrawer({
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
      $getNodeByKey(nodeKey)?.remove()
    })
  }, [editor, nodeKey])

  const updateUpload = useCallback(
    (data: Data) => {
      setParams({
        ...initialParams,
        cacheBust, // do this to get the usePayloadAPI to re-fetch the data even though the URL string hasn't changed
      })

      dispatchCacheBust()
      closeDocumentDrawer()
    },
    [setParams, cacheBust, closeDocumentDrawer],
  )

  const hasExtraFields = (
    editorConfig?.resolvedFeatureMap?.get('upload')
      ?.sanitizedClientFeatureProps as BaseClientFeatureProps<UploadFeaturePropsClient>
  ).collections?.[relatedCollection.slug]?.hasExtraFields

  const onExtraFieldsDrawerSubmit = useCallback(
    (_: FormState, data: JsonObject) => {
      // Update lexical node (with key nodeKey) with new data
      editor.update(() => {
        const uploadNode: null | UploadNode = $getNodeByKey(nodeKey)
        if (uploadNode) {
          const newData: UploadData = {
            ...uploadNode.getData(),
            fields: data,
          }
          uploadNode.setData(newData)
        }
      })
    },
    [editor, nodeKey],
  )

  const aspectRatio =
    thumbnailSRC && data?.width && data?.height
      ? data.width > data.height
        ? 'landscape'
        : 'portrait'
      : 'landscape'

  return (
    <div
      className={`${baseClass} ${baseClass}--${aspectRatio}`}
      data-filename={data?.filename}
      ref={uploadRef}
    >
      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__media`}>
          <Thumbnail
            collectionSlug={relationTo}
            fileSrc={isImage(data?.mimeType) ? thumbnailSRC : null}
            height={data?.height}
            size="none"
            width={data?.width}
          />

          {isEditable && (
            <div className={`${baseClass}__overlay ${baseClass}__floater`}>
              <div className={`${baseClass}__actions`} role="toolbar">
                {hasExtraFields ? (
                  <Button
                    buttonStyle="icon-label"
                    className={`${baseClass}__upload-drawer-toggler`}
                    disabled={!isEditable}
                    el="button"
                    icon="edit"
                    onClick={toggleDrawer}
                    round
                    size="medium"
                    tooltip={t('fields:editRelationship')}
                  />
                ) : null}

                <Button
                  buttonStyle="icon-label"
                  className={`${baseClass}__swap-drawer-toggler`}
                  disabled={!isEditable}
                  el="button"
                  icon="swap"
                  onClick={() => {
                    editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                      replace: { nodeKey },
                    })
                  }}
                  round
                  size="medium"
                  tooltip={t('fields:swapUpload')}
                />

                <Button
                  buttonStyle="icon-label"
                  className={`${baseClass}__removeButton`}
                  disabled={!isEditable}
                  icon="x"
                  onClick={(e) => {
                    e.preventDefault()
                    removeUpload()
                  }}
                  round
                  size="medium"
                  tooltip={t('fields:removeUpload')}
                />
              </div>
            </div>
          )}
        </div>

        <div className={`${baseClass}__metaOverlay ${baseClass}__floater`}>
          <DocumentDrawerToggler className={`${baseClass}__doc-drawer-toggler`}>
            <strong className={`${baseClass}__filename`}>
              {data?.filename || t('general:untitled')}
            </strong>
          </DocumentDrawerToggler>
          <div className={`${baseClass}__collectionLabel`}>
            {getTranslation(relatedCollection.labels.singular, i18n)}
          </div>
        </div>
      </div>

      {value ? <DocumentDrawer onSave={updateUpload} /> : null}
      {hasExtraFields ? (
        <FieldsDrawer
          data={fields}
          drawerSlug={extraFieldsDrawerSlug}
          drawerTitle={t('general:editLabel', {
            label: getTranslation(relatedCollection.labels.singular, i18n),
          })}
          featureKey="upload"
          handleDrawerSubmit={onExtraFieldsDrawerSubmit}
          schemaPath={schemaPath}
          schemaPathSuffix={relatedCollection.slug}
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
