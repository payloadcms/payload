import type {
  BeforeDocumentControlsServerPropsOnly,
  DocumentSlots,
  EditMenuItemsServerPropsOnly,
  PayloadRequest,
  PreviewButtonServerPropsOnly,
  PublishButtonServerPropsOnly,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  SaveButtonServerPropsOnly,
  SaveDraftButtonServerPropsOnly,
  ServerFunction,
  ServerProps,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { ViewDescription } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { hasDraftsEnabled } from 'payload/shared'

import { getDocumentPermissions } from './getDocumentPermissions.js'

export const renderDocumentSlots: (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  id?: number | string
  permissions: SanitizedDocumentPermissions
  req: PayloadRequest
}) => DocumentSlots = (args) => {
  const { id, collectionConfig, globalConfig, hasSavePermission, req } = args

  const components: DocumentSlots = {} as DocumentSlots

  const unsavedDraftWithValidations = undefined

  const isPreviewEnabled = collectionConfig?.admin?.preview || globalConfig?.admin?.preview

  const serverProps: ServerProps = {
    id,
    i18n: req.i18n,
    payload: req.payload,
    user: req.user,
    // TODO: Add remaining serverProps
  }

  const BeforeDocumentControls =
    collectionConfig?.admin?.components?.edit?.beforeDocumentControls ||
    globalConfig?.admin?.components?.elements?.beforeDocumentControls

  if (BeforeDocumentControls) {
    components.BeforeDocumentControls = RenderServerComponent({
      Component: BeforeDocumentControls,
      importMap: req.payload.importMap,
      serverProps: serverProps satisfies BeforeDocumentControlsServerPropsOnly,
    })
  }

  const EditMenuItems = collectionConfig?.admin?.components?.edit?.editMenuItems

  if (EditMenuItems) {
    components.EditMenuItems = RenderServerComponent({
      Component: EditMenuItems,
      importMap: req.payload.importMap,
      serverProps: serverProps satisfies EditMenuItemsServerPropsOnly,
    })
  }

  const CustomPreviewButton =
    collectionConfig?.admin?.components?.edit?.PreviewButton ||
    globalConfig?.admin?.components?.elements?.PreviewButton

  if (isPreviewEnabled && CustomPreviewButton) {
    components.PreviewButton = RenderServerComponent({
      Component: CustomPreviewButton,
      importMap: req.payload.importMap,
      serverProps: serverProps satisfies PreviewButtonServerPropsOnly,
    })
  }

  const LivePreview =
    collectionConfig?.admin?.components?.views?.edit?.livePreview ||
    globalConfig?.admin?.components?.views?.edit?.livePreview

  if (LivePreview?.Component) {
    components.LivePreview = RenderServerComponent({
      Component: LivePreview.Component,
      importMap: req.payload.importMap,
      serverProps,
    })
  }

  const descriptionFromConfig =
    collectionConfig?.admin?.description || globalConfig?.admin?.description

  const staticDescription: StaticDescription =
    typeof descriptionFromConfig === 'function'
      ? descriptionFromConfig({ t: req.i18n.t })
      : descriptionFromConfig

  const CustomDescription =
    collectionConfig?.admin?.components?.Description ||
    globalConfig?.admin?.components?.elements?.Description

  const hasDescription = CustomDescription || staticDescription

  if (hasDescription) {
    components.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig?.slug,
        description: staticDescription,
      } satisfies ViewDescriptionClientProps,
      Component: CustomDescription,
      Fallback: ViewDescription,
      importMap: req.payload.importMap,
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
    const CustomStatus =
      collectionConfig?.admin?.components?.edit?.Status ||
      globalConfig?.admin?.components?.elements?.Status

    if (CustomStatus) {
      components.Status = RenderServerComponent({
        Component: CustomStatus,
        importMap: req.payload.importMap,
        serverProps,
      })
    }
  }

  if (hasSavePermission) {
    if (hasDraftsEnabled(collectionConfig || globalConfig)) {
      const CustomPublishButton =
        collectionConfig?.admin?.components?.edit?.PublishButton ||
        globalConfig?.admin?.components?.elements?.PublishButton

      if (CustomPublishButton) {
        components.PublishButton = RenderServerComponent({
          Component: CustomPublishButton,
          importMap: req.payload.importMap,
          serverProps: serverProps satisfies PublishButtonServerPropsOnly,
        })
      }

      const CustomSaveDraftButton =
        collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
        globalConfig?.admin?.components?.elements?.SaveDraftButton

      const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

      if ((draftsEnabled || unsavedDraftWithValidations) && CustomSaveDraftButton) {
        components.SaveDraftButton = RenderServerComponent({
          Component: CustomSaveDraftButton,
          importMap: req.payload.importMap,
          serverProps: serverProps satisfies SaveDraftButtonServerPropsOnly,
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
          serverProps: serverProps satisfies SaveButtonServerPropsOnly,
        })
      }
    }
  }

  if (collectionConfig?.upload && collectionConfig?.admin?.components?.edit?.Upload) {
    components.Upload = RenderServerComponent({
      Component: collectionConfig.admin.components.edit.Upload,
      importMap: req.payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig?.upload && collectionConfig.upload.admin?.components?.controls) {
    components.UploadControls = RenderServerComponent({
      Component: collectionConfig.upload.admin.components.controls,
      importMap: req.payload.importMap,
      serverProps,
    })
  }

  if (collectionConfig?.upload && collectionConfig.upload.admin?.components?.bulkControls) {
    components.BulkUploadControls = RenderServerComponent({
      Component: collectionConfig.upload.admin.components.bulkControls,
      importMap: req.payload.importMap,
      serverProps,
    })
  }

  return components
}

export const renderDocumentSlotsHandler: ServerFunction<{
  collectionSlug: string
  id?: number | string
}> = async (args) => {
  const { id, collectionSlug, req } = args

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
    id,
    collectionConfig,
    hasSavePermission,
    permissions: docPermissions,
    req,
  })
}
