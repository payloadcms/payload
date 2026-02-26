import type {
  BeforeDocumentControlsServerPropsOnly,
  DocumentSlots,
  EditMenuItemsServerPropsOnly,
  Locale,
  PayloadRequest,
  PreviewButtonServerPropsOnly,
  PublishButtonServerPropsOnly,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  SaveButtonServerPropsOnly,
  SaveDraftButtonServerPropsOnly,
  ServerFunction,
  ServerProps,
  StaticDescription,
  UnpublishButtonServerPropsOnly,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { ViewDescription } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { hasDraftsEnabled } from 'payload/shared'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'

export const renderDocumentSlots: (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  id?: number | string
  locale: Locale
  permissions: SanitizedPermissions
  req: PayloadRequest
}) => DocumentSlots = (args) => {
  const { id, collectionConfig, globalConfig, hasSavePermission, locale, permissions, req } = args

  const components: DocumentSlots = {} as DocumentSlots

  const unsavedDraftWithValidations = undefined

  const isPreviewEnabled = collectionConfig?.admin?.preview || globalConfig?.admin?.preview

  const serverProps: ServerProps = {
    id,
    i18n: req.i18n,
    locale,
    payload: req.payload,
    permissions,
    user: req.user,
    // TODO: Add remaining serverProps
  }

  const adminConfig = getAdminConfig()
  const adminCollectionComponents = collectionConfig
    ? (adminConfig.collections?.[collectionConfig.slug] as any)
    : undefined
  const adminGlobalComponents = globalConfig
    ? (adminConfig.globals?.[globalConfig.slug] as any)
    : undefined

  const BeforeDocumentControls =
    adminCollectionComponents?.edit?.beforeDocumentControls ||
    adminGlobalComponents?.elements?.beforeDocumentControls ||
    collectionConfig?.admin?.components?.edit?.beforeDocumentControls ||
    globalConfig?.admin?.components?.elements?.beforeDocumentControls

  if (BeforeDocumentControls) {
    components.BeforeDocumentControls = RenderServerComponent({
      Component: BeforeDocumentControls,
      serverProps: serverProps satisfies BeforeDocumentControlsServerPropsOnly,
    })
  }

  const EditMenuItems =
    adminCollectionComponents?.edit?.editMenuItems ||
    collectionConfig?.admin?.components?.edit?.editMenuItems

  if (EditMenuItems) {
    components.EditMenuItems = RenderServerComponent({
      Component: EditMenuItems,
      serverProps: serverProps satisfies EditMenuItemsServerPropsOnly,
    })
  }

  const CustomPreviewButton =
    adminCollectionComponents?.edit?.PreviewButton ||
    adminGlobalComponents?.elements?.PreviewButton ||
    collectionConfig?.admin?.components?.edit?.PreviewButton ||
    globalConfig?.admin?.components?.elements?.PreviewButton

  if (isPreviewEnabled && CustomPreviewButton) {
    components.PreviewButton = RenderServerComponent({
      Component: CustomPreviewButton,
      serverProps: serverProps satisfies PreviewButtonServerPropsOnly,
    })
  }

  const LivePreview =
    adminCollectionComponents?.views?.edit?.livePreview ||
    adminGlobalComponents?.views?.edit?.livePreview ||
    collectionConfig?.admin?.components?.views?.edit?.livePreview ||
    globalConfig?.admin?.components?.views?.edit?.livePreview

  if (LivePreview?.Component) {
    components.LivePreview = RenderServerComponent({
      Component: LivePreview.Component,
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
    adminCollectionComponents?.Description ||
    adminGlobalComponents?.elements?.Description ||
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
      serverProps: serverProps satisfies ViewDescriptionServerPropsOnly,
    })
  }

  if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
    const CustomStatus =
      adminCollectionComponents?.edit?.Status ||
      adminGlobalComponents?.elements?.Status ||
      collectionConfig?.admin?.components?.edit?.Status ||
      globalConfig?.admin?.components?.elements?.Status

    if (CustomStatus) {
      components.Status = RenderServerComponent({
        Component: CustomStatus,
        serverProps,
      })
    }
  }

  if (hasSavePermission) {
    if (hasDraftsEnabled(collectionConfig || globalConfig)) {
      const CustomPublishButton =
        adminCollectionComponents?.edit?.PublishButton ||
        adminGlobalComponents?.elements?.PublishButton ||
        collectionConfig?.admin?.components?.edit?.PublishButton ||
        globalConfig?.admin?.components?.elements?.PublishButton

      if (CustomPublishButton) {
        components.PublishButton = RenderServerComponent({
          Component: CustomPublishButton,
          serverProps: serverProps satisfies PublishButtonServerPropsOnly,
        })
      }

      const CustomUnpublishButton =
        adminCollectionComponents?.edit?.UnpublishButton ||
        adminGlobalComponents?.elements?.UnpublishButton ||
        collectionConfig?.admin?.components?.edit?.UnpublishButton ||
        globalConfig?.admin?.components?.elements?.UnpublishButton

      if (CustomUnpublishButton) {
        components.UnpublishButton = RenderServerComponent({
          Component: CustomUnpublishButton,
          serverProps: serverProps satisfies UnpublishButtonServerPropsOnly,
        })
      }

      const CustomSaveDraftButton =
        adminCollectionComponents?.edit?.SaveDraftButton ||
        adminGlobalComponents?.elements?.SaveDraftButton ||
        collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
        globalConfig?.admin?.components?.elements?.SaveDraftButton

      const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

      if ((draftsEnabled || unsavedDraftWithValidations) && CustomSaveDraftButton) {
        components.SaveDraftButton = RenderServerComponent({
          Component: CustomSaveDraftButton,
          serverProps: serverProps satisfies SaveDraftButtonServerPropsOnly,
        })
      }
    } else {
      const CustomSaveButton =
        adminCollectionComponents?.edit?.SaveButton ||
        adminGlobalComponents?.elements?.SaveButton ||
        collectionConfig?.admin?.components?.edit?.SaveButton ||
        globalConfig?.admin?.components?.elements?.SaveButton

      if (CustomSaveButton) {
        components.SaveButton = RenderServerComponent({
          Component: CustomSaveButton,
          serverProps: serverProps satisfies SaveButtonServerPropsOnly,
        })
      }
    }
  }

  if (collectionConfig?.upload) {
    const UploadComponent =
      adminCollectionComponents?.edit?.Upload || collectionConfig?.admin?.components?.edit?.Upload

    if (UploadComponent) {
      components.Upload = RenderServerComponent({
        Component: UploadComponent,
        serverProps,
      })
    }
  }

  if (collectionConfig?.upload && collectionConfig.upload.admin?.components?.controls) {
    components.UploadControls = RenderServerComponent({
      Component: collectionConfig.upload.admin.components.controls,
      serverProps,
    })
  }

  return components
}

export const renderDocumentSlotsHandler: ServerFunction<{
  collectionSlug: string
  id?: number | string
}> = async (args) => {
  const { id, collectionSlug, locale, permissions, req } = args

  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Error(req.t('error:incorrectCollection'))
  }

  const { hasSavePermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data: {},
    req,
  })

  return renderDocumentSlots({
    id,
    collectionConfig,
    hasSavePermission,
    locale,
    permissions,
    req,
  })
}
