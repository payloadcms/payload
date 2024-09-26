import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientConfig,
  EntitySlots,
  FormState,
  ImportMap,
  Payload,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { DefaultPublishButton, DefaultSaveButton, DefaultSaveDraftButton } from '@payloadcms/ui'
import React from 'react'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { RenderServerFields } from '../elements/RenderServerFields/index.js'

export const renderEntity: (args: {
  clientConfig: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  formState: FormState
  globalConfig?: SanitizedGlobalConfig
  hasSavePermission: boolean
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
  permissions: Permissions
}) => EntitySlots = (args) => {
  const {
    clientConfig,
    collectionConfig,
    config,
    formState,
    globalConfig,
    hasSavePermission,
    i18n,
    importMap,
    payload,
    permissions,
  } = args

  const clientCollectionConfig = clientConfig.collections?.find(
    (collection) => collection.slug === collectionConfig?.slug,
  )

  const clientGlobalConfig = clientConfig.globals?.find(
    (global) => global.slug === globalConfig?.slug,
  )

  const components: EntitySlots = {} as EntitySlots

  const unsavedDraftWithValidations = undefined

  if (collectionConfig?.admin?.preview || globalConfig?.admin?.preview) {
    components.PreviewButton = (
      <RenderServerComponent
        Component={
          collectionConfig?.admin?.components?.edit?.PreviewButton ||
          globalConfig?.admin?.components?.elements?.PreviewButton
        }
        Fallback={DefaultPublishButton}
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
          Fallback={DefaultPublishButton}
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
            Fallback={DefaultSaveDraftButton}
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
          Fallback={DefaultSaveButton}
          importMap={importMap}
        />
      )
    }
  }

  components.Fields = (
    <RenderServerFields
      clientFields={(clientCollectionConfig || clientGlobalConfig)?.fields}
      config={config}
      fields={(collectionConfig || globalConfig)?.fields}
      formState={formState}
      i18n={i18n}
      importMap={importMap}
      payload={payload}
      permissions={
        collectionConfig
          ? permissions?.collections?.[collectionConfig?.slug]?.fields
          : globalConfig
            ? permissions?.globals?.[globalConfig.slug]?.fields
            : undefined
      }
    />
  )

  return components
}
