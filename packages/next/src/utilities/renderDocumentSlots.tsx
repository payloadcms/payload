import type {
  DocumentSlots,
  ImportMap,
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { PublishButton, SaveButton, SaveDraftButton } from '@payloadcms/ui'
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

  if (collectionConfig?.admin?.preview || globalConfig?.admin?.preview) {
    components.PreviewButton = (
      <RenderServerComponent
        Component={
          collectionConfig?.admin?.components?.edit?.PreviewButton ||
          globalConfig?.admin?.components?.elements?.PreviewButton
        }
        Fallback={PublishButton}
        importMap={importMap}
      />
    )
  }

  if (hasSavePermission) {
    if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
      components.PublishButton = (
        <RenderServerComponent
          Component={
            collectionConfig?.admin?.components?.edit?.PublishButton ||
            globalConfig?.admin?.components?.elements?.PublishButton
          }
          Fallback={PublishButton}
          importMap={importMap}
        />
      )

      if (
        (collectionConfig?.versions?.drafts && !collectionConfig?.versions?.drafts?.autosave) ||
        unsavedDraftWithValidations ||
        (globalConfig?.versions?.drafts && !globalConfig?.versions?.drafts?.autosave)
      ) {
        components.SaveDraftButton = (
          <RenderServerComponent
            Component={
              collectionConfig?.admin?.components?.edit?.SaveDraftButton ||
              globalConfig?.admin?.components?.elements?.SaveDraftButton
            }
            Fallback={SaveDraftButton}
            importMap={importMap}
          />
        )
      }
    } else {
      components.SaveButton = (
        <RenderServerComponent
          Component={
            collectionConfig?.admin?.components?.edit?.SaveButton ||
            globalConfig?.admin?.components?.elements?.SaveButton
          }
          Fallback={SaveButton}
          importMap={importMap}
        />
      )
    }
  }

  return components
}
