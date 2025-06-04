import type {
  BeforeDocumentControlsServerPropsOnly,
  DocumentViewServerProps,
  EditMenuItemsServerPropsOnly,
  LivePreviewConfig,
  ServerProps,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import './index.scss'
import { LivePreviewClient } from './index.client.js'
export async function LivePreviewView(props: DocumentViewServerProps) {
  const { doc, initPageResult } = props

  const { collectionConfig, globalConfig, locale, req } = initPageResult

  let livePreviewConfig: LivePreviewConfig = req.payload.config?.admin?.livePreview

  const serverProps: ServerProps = {
    i18n: req.i18n,
    payload: req.payload,
    user: req.user,
    // TODO: Add remaining serverProps
  }

  if (collectionConfig) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(collectionConfig.admin.livePreview || {}),
    }
  }

  if (globalConfig) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(globalConfig.admin.livePreview || {}),
    }
  }

  const BeforeDocumentControls =
    collectionConfig?.admin?.components?.edit?.beforeDocumentControls ||
    globalConfig?.admin?.components?.elements?.beforeDocumentControls

  const EditMenuItems = collectionConfig?.admin?.components?.edit?.editMenuItems

  const breakpoints: LivePreviewConfig['breakpoints'] = [
    ...(livePreviewConfig?.breakpoints || []),
    {
      name: 'responsive',
      height: '100%',
      label: 'Responsive',
      width: '100%',
    },
  ]

  const url =
    typeof livePreviewConfig?.url === 'function'
      ? await livePreviewConfig.url({
          collectionConfig,
          data: doc,
          globalConfig,
          locale,
          req,
          /**
           * @deprecated
           * Use `req.payload` instead. This will be removed in the next major version.
           */
          payload: initPageResult.req.payload,
        })
      : livePreviewConfig?.url

  return (
    <LivePreviewClient
      BeforeDocumentControls={
        BeforeDocumentControls
          ? RenderServerComponent({
              Component: BeforeDocumentControls,
              importMap: req.payload.importMap,
              serverProps: serverProps satisfies BeforeDocumentControlsServerPropsOnly,
            })
          : null
      }
      breakpoints={breakpoints}
      Description={props.Description}
      EditMenuItems={
        EditMenuItems
          ? RenderServerComponent({
              Component: EditMenuItems,
              importMap: req.payload.importMap,
              serverProps: serverProps satisfies EditMenuItemsServerPropsOnly,
            })
          : null
      }
      initialData={doc}
      PreviewButton={props.PreviewButton}
      PublishButton={props.PublishButton}
      SaveButton={props.SaveButton}
      SaveDraftButton={props.SaveDraftButton}
      Upload={props.Upload}
      url={url}
    />
  )
}
