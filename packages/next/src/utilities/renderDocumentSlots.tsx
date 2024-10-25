import type {
  DocumentSlots,
  ImportMap,
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import React from 'react'

import { RenderServerComponent } from '../../../ui/src/elements/RenderServerComponent/index.js'

export const renderDocumentSlots: (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  importMap: ImportMap
  payload: Payload
  permissions: Permissions
}) => DocumentSlots = (args) => {
  const { collectionConfig, globalConfig, hasSavePermission, importMap } = args

  const components: DocumentSlots = {} as DocumentSlots

  const unsavedDraftWithValidations = undefined

  if (
    (collectionConfig?.admin?.preview || globalConfig?.admin?.preview) &&
    (collectionConfig?.admin?.components?.edit?.PreviewButton ||
      globalConfig?.admin?.components?.elements?.PreviewButton)
  ) {
    components.PreviewButton = (
      <RenderServerComponent
        Component={
          collectionConfig?.admin?.components?.edit?.PreviewButton ||
          globalConfig?.admin?.components?.elements?.PreviewButton
        }
        importMap={importMap}
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
            importMap={importMap}
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
            importMap={importMap}
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
            importMap={importMap}
          />
        )
      }
    }
  }

  return components
}
