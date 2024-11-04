import type {
  DocumentSlots,
  PayloadRequest,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { ViewDescription } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

export const renderDocumentSlots: (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  permissions: Permissions
  req: PayloadRequest
}) => DocumentSlots = (args) => {
  const { collectionConfig, globalConfig, hasSavePermission, req } = args

  const components: DocumentSlots = {} as DocumentSlots

  const unsavedDraftWithValidations = undefined

  const hasPreviewButton =
    (collectionConfig?.admin?.preview || globalConfig?.admin?.preview) &&
    (collectionConfig?.admin?.components?.edit?.PreviewButton ||
      globalConfig?.admin?.components?.elements?.PreviewButton)

  if (hasPreviewButton) {
    components.PreviewButton = (
      <RenderServerComponent
        Component={
          collectionConfig?.admin?.components?.edit?.PreviewButton ||
          globalConfig?.admin?.components?.elements?.PreviewButton
        }
        importMap={req.payload.importMap}
      />
    )
  }

  let description

  if (collectionConfig?.admin?.description || globalConfig?.admin?.description) {
    description = collectionConfig?.admin?.description || globalConfig?.admin?.description

    if (typeof description === 'function') {
      description = description({ t: req.i18n.t })
    }
  }

  const hasDescription =
    collectionConfig?.admin?.components?.Description ||
    globalConfig?.admin?.components?.elements?.Description ||
    description

  if (hasDescription) {
    components.Description = (
      <RenderServerComponent
        clientProps={{ description }}
        Component={
          collectionConfig?.admin?.components?.Description ||
          globalConfig?.admin?.components?.elements?.Description
        }
        Fallback={ViewDescription}
        importMap={req.payload.importMap}
      />
    )
  }

  if (hasSavePermission) {
    if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
      if (
        collectionConfig?.admin?.components?.edit?.PublishButton ||
        globalConfig?.admin?.components?.elements?.PublishButton
      ) {
        components.PublishButton = (
          <RenderServerComponent
            Component={
              collectionConfig?.admin?.components?.edit?.PublishButton ||
              globalConfig?.admin?.components?.elements?.PublishButton
            }
            importMap={req.payload.importMap}
          />
        )
      }

      if (
        ((collectionConfig?.versions?.drafts && !collectionConfig?.versions?.drafts?.autosave) ||
          unsavedDraftWithValidations ||
          (globalConfig?.versions?.drafts && !globalConfig?.versions?.drafts?.autosave)) &&
        (collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
          globalConfig?.admin?.components?.elements?.SaveDraftButton)
      ) {
        components.SaveDraftButton = (
          <RenderServerComponent
            Component={
              collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
              globalConfig?.admin?.components?.elements?.SaveDraftButton
            }
            importMap={req.payload.importMap}
          />
        )
      }
    } else {
      if (
        collectionConfig?.admin?.components?.edit?.SaveButton ||
        globalConfig?.admin?.components?.elements?.SaveButton
      ) {
        components.SaveButton = (
          <RenderServerComponent
            Component={
              collectionConfig?.admin?.components?.edit?.SaveButton ||
              globalConfig?.admin?.components?.elements?.SaveButton
            }
            importMap={req.payload.importMap}
          />
        )
      }
    }
  }

  return components
}
