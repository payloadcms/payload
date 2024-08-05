import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewProps,
  EditViewProps,
  Payload,
  SanitizedCollectionConfig,
  SanitizedConfig,
} from 'payload'

import { isReactComponentOrFunction } from 'payload/shared'
import React from 'react'

import type { ViewDescriptionProps } from '../../../elements/ViewDescription/index.js'
import type { WithServerSidePropsPrePopulated } from './index.js'
import type { CollectionComponentMap } from './types.js'

// Need to import from client barrel file
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ViewDescription } from '../../../exports/client/index.js'
import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapCollections = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  WithServerSideProps: WithServerSidePropsPrePopulated
  collections: SanitizedCollectionConfig[]
  config: SanitizedConfig
  i18n: I18nClient
  payload: Payload
  readOnly?: boolean
}): {
  [key: SanitizedCollectionConfig['slug']]: CollectionComponentMap
} => {
  const {
    DefaultEditView,
    DefaultListView,
    WithServerSideProps,
    collections,
    config,
    i18n,
    i18n: { t },
    payload,
    readOnly: readOnlyOverride,
  } = args

  return collections.reduce((acc, collectionConfig) => {
    const { slug, fields } = collectionConfig

    const internalCollections = ['payload-preferences', 'payload-migrations']

    if (internalCollections.includes(slug)) {
      return acc
    }

    const editViewFromConfig = collectionConfig?.admin?.components?.views?.Edit

    const listViewFromConfig = collectionConfig?.admin?.components?.views?.List

    const CustomEditView =
      typeof editViewFromConfig === 'function'
        ? editViewFromConfig
        : typeof editViewFromConfig === 'object' &&
            isReactComponentOrFunction(editViewFromConfig.Default)
          ? editViewFromConfig.Default
          : typeof editViewFromConfig?.Default === 'object' &&
              'Component' in editViewFromConfig.Default &&
              isReactComponentOrFunction(editViewFromConfig.Default.Component)
            ? (editViewFromConfig.Default.Component as React.FC<EditViewProps>)
            : undefined

    const CustomListView =
      typeof listViewFromConfig === 'function'
        ? listViewFromConfig
        : typeof listViewFromConfig === 'object' &&
            isReactComponentOrFunction(listViewFromConfig.Component)
          ? listViewFromConfig.Component
          : undefined

    const Edit = (CustomEditView as React.FC<EditViewProps>) || DefaultEditView

    const List = CustomListView || DefaultListView

    const SaveButtonComponent = collectionConfig?.admin?.components?.edit?.SaveButton

    const SaveButton = SaveButtonComponent ? (
      <WithServerSideProps Component={SaveButtonComponent} />
    ) : undefined

    const SaveDraftButtonComponent = collectionConfig?.admin?.components?.edit?.SaveDraftButton

    const SaveDraftButton = SaveDraftButtonComponent ? (
      <WithServerSideProps Component={SaveDraftButtonComponent} />
    ) : undefined

    const PreviewButtonComponent = collectionConfig?.admin?.components?.edit?.PreviewButton

    const PreviewButton = PreviewButtonComponent ? (
      <WithServerSideProps Component={PreviewButtonComponent} />
    ) : undefined

    const PublishButtonComponent = collectionConfig?.admin?.components?.edit?.PublishButton

    const PublishButton = PublishButtonComponent ? (
      <WithServerSideProps Component={PublishButtonComponent} />
    ) : undefined

    const UploadComponent = collectionConfig?.admin?.components?.edit?.Upload

    const Upload = UploadComponent ? <WithServerSideProps Component={UploadComponent} /> : undefined

    const beforeList = collectionConfig?.admin?.components?.beforeList

    const BeforeList =
      (beforeList &&
        Array.isArray(beforeList) &&
        beforeList?.map((Component, i) => <WithServerSideProps Component={Component} key={i} />)) ||
      null

    const beforeListTable = collectionConfig?.admin?.components?.beforeListTable

    const BeforeListTable =
      (beforeListTable &&
        Array.isArray(beforeListTable) &&
        beforeListTable?.map((Component, i) => (
          <WithServerSideProps Component={Component} key={i} />
        ))) ||
      null

    const afterList = collectionConfig?.admin?.components?.afterList

    const AfterList =
      (afterList &&
        Array.isArray(afterList) &&
        afterList?.map((Component, i) => <WithServerSideProps Component={Component} key={i} />)) ||
      null

    const afterListTable = collectionConfig?.admin?.components?.afterListTable

    const AfterListTable =
      (afterListTable &&
        Array.isArray(afterListTable) &&
        afterListTable?.map((Component, i) => (
          <WithServerSideProps Component={Component} key={i} />
        ))) ||
      null

    let description = undefined
    if (collectionConfig.admin && 'description' in collectionConfig.admin) {
      if (
        typeof collectionConfig.admin?.description === 'string' ||
        typeof collectionConfig.admin?.description === 'object'
      ) {
        description = collectionConfig.admin.description
      } else if (typeof collectionConfig.admin?.description === 'function') {
        description = collectionConfig.admin?.description({ t })
      }
    }

    const descriptionProps: ViewDescriptionProps = {
      description,
    }

    const DescriptionComponent =
      collectionConfig.admin?.components?.edit?.Description ||
      (description ? ViewDescription : undefined)

    const Description =
      DescriptionComponent !== undefined ? (
        <WithServerSideProps Component={DescriptionComponent} {...(descriptionProps || {})} />
      ) : undefined

    const componentMap: CollectionComponentMap = {
      AfterList,
      AfterListTable,
      BeforeList,
      BeforeListTable,
      Description,
      Edit: <Edit collectionSlug={collectionConfig.slug} />,
      List: <List collectionSlug={collectionConfig.slug} />,
      PreviewButton,
      PublishButton,
      SaveButton,
      SaveDraftButton,
      Upload,
      actionsMap: mapActions({
        WithServerSideProps,
        collectionConfig,
      }),
      fieldMap: mapFields({
        WithServerSideProps,
        config,
        fieldSchema: fields,
        i18n,
        payload,
        readOnly: readOnlyOverride,
      }),
      isPreviewEnabled: !!collectionConfig?.admin?.preview,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})
}
