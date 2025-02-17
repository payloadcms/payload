import type {
  DefaultServerFunctionArgs,
  DocumentSlots,
  PayloadRequest,
  PreviewButtonServerPropsOnly,
  PublishButtonServerPropsOnly,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  SaveButtonServerPropsOnly,
  SaveDraftButtonServerPropsOnly,
  ServerProps,
  StaticDescription,
  ViewDescriptionClientProps,
  ViewDescriptionServerPropsOnly,
} from 'payload'

import { ViewDescription } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

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

  const serverProps: ServerProps = {
    i18n: req.i18n,
    payload: req.payload,
    user: req.user,
    // TODO: Add remaining serverProps
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

  if (hasSavePermission) {
    if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
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

      const draftsEnabled =
        (collectionConfig?.versions?.drafts && !collectionConfig?.versions?.drafts?.autosave) ||
        (globalConfig?.versions?.drafts && !globalConfig?.versions?.drafts?.autosave)

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
