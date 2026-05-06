import type {
  CustomComponent,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  ServerFunction,
  StaticDescription,
} from 'payload'

import { hasDraftsEnabled } from 'payload/shared'

import { getDocumentPermissions } from '../../views/Document/getDocumentPermissions.js'

/**
 * Serializable slot configuration — component references instead of rendered nodes.
 * The client resolves these via the import map and renders them.
 */
export type DocumentSlotConfigs = {
  BeforeDocumentControls?: CustomComponent[]
  Description?: {
    Component?: PayloadComponent
    staticDescription?: StaticDescription
  }
  EditMenuItems?: CustomComponent[]
  LivePreview?: PayloadComponent
  PreviewButton?: PayloadComponent
  PublishButton?: PayloadComponent
  SaveButton?: PayloadComponent
  SaveDraftButton?: PayloadComponent
  Status?: PayloadComponent
  UnpublishButton?: PayloadComponent
  Upload?: PayloadComponent
  UploadControls?: PayloadComponent[]
}

export type RenderDocumentSlotsDataOnlyResult = {
  slotConfigs: DocumentSlotConfigs
}

/**
 * Data-only alternative to `renderDocumentSlotsHandler`.
 * Returns component references (import map paths) instead of rendered React nodes.
 */
export const renderDocumentSlotsDataOnlyHandler: ServerFunction<
  {
    collectionSlug: string
    id?: number | string
  },
  Promise<RenderDocumentSlotsDataOnlyResult>
> = async (args) => {
  const { id, collectionSlug, req } = args

  const collectionConfig: SanitizedCollectionConfig | undefined =
    req.payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Error(req.t('error:incorrectCollection'))
  }

  const globalConfig: SanitizedGlobalConfig | undefined = req.payload.config.globals.find(
    (global) => global.slug === collectionSlug,
  )

  const { hasSavePermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data: {},
    req,
  })

  const slotConfigs: DocumentSlotConfigs = {}

  const isPreviewEnabled = collectionConfig?.admin?.preview || globalConfig?.admin?.preview

  const BeforeDocumentControls =
    collectionConfig?.admin?.components?.edit?.beforeDocumentControls ||
    globalConfig?.admin?.components?.edit?.beforeDocumentControls

  if (BeforeDocumentControls) {
    slotConfigs.BeforeDocumentControls = BeforeDocumentControls
  }

  const EditMenuItems = collectionConfig?.admin?.components?.edit?.editMenuItems

  if (EditMenuItems) {
    slotConfigs.EditMenuItems = EditMenuItems
  }

  const CustomPreviewButton =
    collectionConfig?.admin?.components?.edit?.PreviewButton ||
    globalConfig?.admin?.components?.edit?.PreviewButton

  if (isPreviewEnabled && CustomPreviewButton) {
    slotConfigs.PreviewButton = CustomPreviewButton
  }

  const LivePreview =
    collectionConfig?.admin?.components?.views?.edit?.livePreview ||
    globalConfig?.admin?.components?.views?.edit?.livePreview

  if (LivePreview?.Component) {
    slotConfigs.LivePreview = LivePreview.Component
  }

  const descriptionFromConfig =
    collectionConfig?.admin?.description || globalConfig?.admin?.description

  const staticDescription: StaticDescription =
    typeof descriptionFromConfig === 'function'
      ? descriptionFromConfig({ t: req.i18n.t })
      : descriptionFromConfig

  const CustomDescription =
    collectionConfig?.admin?.components?.Description || globalConfig?.admin?.components?.Description

  if (CustomDescription || staticDescription) {
    slotConfigs.Description = {
      Component: CustomDescription,
      staticDescription,
    }
  }

  if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
    const CustomStatus =
      collectionConfig?.admin?.components?.edit?.Status ||
      globalConfig?.admin?.components?.edit?.Status

    if (CustomStatus) {
      slotConfigs.Status = CustomStatus
    }
  }

  if (hasSavePermission) {
    if (hasDraftsEnabled(collectionConfig || globalConfig)) {
      const CustomPublishButton =
        collectionConfig?.admin?.components?.edit?.PublishButton ||
        globalConfig?.admin?.components?.edit?.PublishButton

      if (CustomPublishButton) {
        slotConfigs.PublishButton = CustomPublishButton
      }

      const CustomUnpublishButton =
        collectionConfig?.admin?.components?.edit?.UnpublishButton ||
        globalConfig?.admin?.components?.edit?.UnpublishButton

      if (CustomUnpublishButton) {
        slotConfigs.UnpublishButton = CustomUnpublishButton
      }

      const CustomSaveDraftButton =
        collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
        globalConfig?.admin?.components?.edit?.SaveDraftButton

      if (CustomSaveDraftButton) {
        slotConfigs.SaveDraftButton = CustomSaveDraftButton
      }
    } else {
      const CustomSaveButton =
        collectionConfig?.admin?.components?.edit?.SaveButton ||
        globalConfig?.admin?.components?.edit?.SaveButton

      if (CustomSaveButton) {
        slotConfigs.SaveButton = CustomSaveButton
      }
    }
  }

  if (collectionConfig?.upload && collectionConfig?.admin?.components?.edit?.Upload) {
    slotConfigs.Upload = collectionConfig.admin.components.edit.Upload
  }

  if (collectionConfig?.upload && collectionConfig.upload.admin?.components?.controls) {
    slotConfigs.UploadControls = collectionConfig.upload.admin.components.controls
  }

  return { slotConfigs }
}
