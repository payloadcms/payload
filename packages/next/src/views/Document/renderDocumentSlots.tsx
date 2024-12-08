import type {
  DefaultServerFunctionArgs,
  DocumentSlots,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  StaticDescription,
} from 'payload'

import { ViewDescription } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { getDocumentPermissions } from './getDocumentPermissions.js'

export const renderDocumentSlots: (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  permissions: SanitizedDocumentPermissions
  req: PayloadRequest
}) => DocumentSlots = (args) => {
  const { collectionConfig, globalConfig, hasSavePermission, req } = args

  const components: DocumentSlots = {} as DocumentSlots

  const unsavedDraftWithValidations = undefined

  const isPreviewEnabled = collectionConfig?.admin?.preview || globalConfig?.admin?.preview

  const CustomPreviewButton =
    collectionConfig?.admin?.components?.edit?.PreviewButton ||
    globalConfig?.admin?.components?.elements?.PreviewButton

  if (isPreviewEnabled && CustomPreviewButton) {
    components.PreviewButton = RenderServerComponent({
      Component: CustomPreviewButton,
      importMap: req.payload.importMap,
    })
  }

  const globalDescriptionFromConfig = globalConfig?.admin?.description

  const staticGlobalDescription: StaticDescription =
    typeof globalDescriptionFromConfig === 'function'
      ? globalDescriptionFromConfig({ t: req.i18n.t })
      : globalDescriptionFromConfig

  const CustomDescription =
    collectionConfig?.admin?.components?.edit?.Description ||
    globalConfig?.admin?.components?.elements?.Description

  const hasDescription = CustomDescription || staticGlobalDescription

  if (hasDescription) {
    components.Description = RenderServerComponent({
      clientProps: staticGlobalDescription ? { description: staticGlobalDescription } : {},
      Component: CustomDescription,
      Fallback: ViewDescription,
      importMap: req.payload.importMap,
    })
  }

  if (hasSavePermission) {
    if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
      const CustomPublishButton =
        collectionConfig?.admin?.components?.edit?.PublishButton ||
        globalConfig?.admin?.components?.elements?.PublishButton

      if (CustomPublishButton) {
        components.PublishButton = RenderServerComponent({
          Component: CustomPublishButton,
          importMap: req.payload.importMap,
        })
      }
      const CustomSaveDraftButton =
        collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
        globalConfig?.admin?.components?.elements?.SaveDraftButton

      const draftsEnabled =
        (collectionConfig?.versions?.drafts && !collectionConfig?.versions?.drafts?.autosave) ||
        (globalConfig?.versions?.drafts && !globalConfig?.versions?.drafts?.autosave)

      if ((draftsEnabled || unsavedDraftWithValidations) && CustomSaveDraftButton) {
        components.SaveDraftButton = RenderServerComponent({
          Component: CustomSaveDraftButton,
          importMap: req.payload.importMap,
        })
      }
    } else {
      const CustomSaveButton =
        collectionConfig?.admin?.components?.edit?.SaveButton ||
        globalConfig?.admin?.components?.elements?.SaveButton

      if (CustomSaveButton) {
        components.SaveButton = RenderServerComponent({
          Component: CustomSaveButton,
          importMap: req.payload.importMap,
        })
      }
    }
  }

  return components
}

export const renderDocumentSlotsHandler = async (
  args: { collectionSlug: string } & DefaultServerFunctionArgs,
) => {
  const { collectionSlug, req } = args

  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Error(req.t('error:incorrectCollection'))
  }

  const { docPermissions, hasSavePermission } = await getDocumentPermissions({
    collectionConfig,
    data: {},
    req,
  })

  return renderDocumentSlots({
    collectionConfig,
    hasSavePermission,
    permissions: docPermissions,
    req,
  })
}
