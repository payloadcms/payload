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

import { PublishButton, SaveButton, SaveDraftButton } from '@payloadcms/ui'
import { fieldIsSidebar } from 'payload/shared'
import React, { Fragment } from 'react'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { renderFields } from './renderFields.js'

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

  const fields = (collectionConfig || globalConfig)?.fields
  const clientFields = (clientCollectionConfig || clientGlobalConfig)?.fields

  const components: EntitySlots = {} as EntitySlots

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

  const mainFields = fields.filter((field) => !fieldIsSidebar(field))
  const mainClientFields = clientFields?.filter((field) => !fieldIsSidebar(field))

  const sidebarFields = fields.filter((field) => fieldIsSidebar(field))
  const sidebarClientFields = clientFields?.filter((field) => fieldIsSidebar(field))

  components.MainFields = (
    <Fragment>
      {renderFields({
        clientConfig,
        clientFields: mainClientFields,
        config,
        fields: mainFields,
        formState,
        i18n,
        importMap,
        payload,
        permissions: collectionConfig
          ? permissions?.collections?.[collectionConfig?.slug]?.fields
          : globalConfig
            ? permissions?.globals?.[globalConfig.slug]?.fields
            : undefined,
        schemaPath: collectionConfig?.slug || globalConfig?.slug,
      })?.map((F) => F)}
    </Fragment>
  )

  components.SidebarFields = (
    <Fragment>
      {renderFields({
        clientConfig,
        clientFields: sidebarClientFields,
        config,
        fields: sidebarFields,
        formState,
        i18n,
        importMap,
        payload,
        permissions: collectionConfig
          ? permissions?.collections?.[collectionConfig?.slug]?.fields
          : globalConfig
            ? permissions?.globals?.[globalConfig.slug]?.fields
            : undefined,
        schemaPath: collectionConfig?.slug || globalConfig?.slug,
      })?.map((F) => F)}
    </Fragment>
  )

  return components
}
