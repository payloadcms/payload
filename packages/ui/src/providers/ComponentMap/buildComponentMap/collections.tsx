import type { I18n } from '@payloadcms/translations'
import type { ViewDescriptionProps } from '@payloadcms/ui/elements/ViewDescription'
import type {
  AdminViewProps,
  EditViewProps,
  EntityDescriptionComponent,
  EntityDescriptionFunction,
  SanitizedCollectionConfig,
  SanitizedConfig,
} from 'payload/types'

import { ViewDescription } from '@payloadcms/ui/elements/ViewDescription'
import { isPlainFunction, isReactComponent } from 'payload/utilities'
import React from 'react'

import type { CollectionComponentMap } from './types.js'

import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapCollections = ({
  DefaultEditView,
  DefaultListView,
  collections,
  config,
  i18n,
  readOnly: readOnlyOverride,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collections: SanitizedCollectionConfig[]
  config: SanitizedConfig
  i18n: I18n
  readOnly?: boolean
}): {
  [key: SanitizedCollectionConfig['slug']]: CollectionComponentMap
} =>
  collections.reduce((acc, collectionConfig) => {
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
        : typeof editViewFromConfig === 'object' && typeof editViewFromConfig.Default === 'function'
          ? editViewFromConfig.Default
          : typeof editViewFromConfig?.Default === 'object' &&
              'Component' in editViewFromConfig.Default &&
              typeof editViewFromConfig.Default.Component === 'function'
            ? (editViewFromConfig.Default.Component as React.FC<EditViewProps>)
            : undefined

    const CustomListView =
      typeof listViewFromConfig === 'function'
        ? listViewFromConfig
        : typeof listViewFromConfig === 'object' &&
            typeof listViewFromConfig.Component === 'function'
          ? listViewFromConfig.Component
          : undefined

    const Edit = (CustomEditView as React.FC<EditViewProps>) || DefaultEditView

    const List = CustomListView || DefaultListView

    const beforeList = collectionConfig?.admin?.components?.BeforeList

    const beforeListTable = collectionConfig?.admin?.components?.BeforeListTable

    const afterList = collectionConfig?.admin?.components?.AfterList

    const afterListTable = collectionConfig?.admin?.components?.AfterListTable

    const SaveButtonComponent = collectionConfig?.admin?.components?.edit?.SaveButton
    const SaveButton = SaveButtonComponent ? <SaveButtonComponent /> : undefined

    const SaveDraftButtonComponent = collectionConfig?.admin?.components?.edit?.SaveDraftButton
    const SaveDraftButton = SaveDraftButtonComponent ? <SaveDraftButtonComponent /> : undefined

    const PreviewButtonComponent = collectionConfig?.admin?.components?.edit?.PreviewButton
    const PreviewButton = PreviewButtonComponent ? <PreviewButtonComponent /> : undefined

    const PublishButtonComponent = collectionConfig?.admin?.components?.edit?.PublishButton
    const PublishButton = PublishButtonComponent ? <PublishButtonComponent /> : undefined

    const BeforeList =
      (beforeList && Array.isArray(beforeList) && beforeList?.map((Component) => <Component />)) ||
      null

    const BeforeListTable =
      (beforeListTable &&
        Array.isArray(beforeListTable) &&
        beforeListTable?.map((Component) => <Component />)) ||
      null

    const AfterList =
      (afterList && Array.isArray(afterList) && afterList?.map((Component) => <Component />)) ||
      null

    const AfterListTable =
      (afterListTable &&
        Array.isArray(afterListTable) &&
        afterListTable?.map((Component) => <Component />)) ||
      null

    const descriptionProps: ViewDescriptionProps = {
      description:
        (collectionConfig.admin &&
          'description' in collectionConfig.admin &&
          (((typeof collectionConfig.admin?.description === 'string' ||
            typeof collectionConfig.admin?.description === 'object') &&
            collectionConfig.admin.description) ||
            (typeof collectionConfig.admin?.description === 'function' &&
              isPlainFunction<EntityDescriptionFunction>(collectionConfig.admin?.description) &&
              collectionConfig.admin?.description()))) ||
        undefined,
    }

    const DescriptionComponent =
      (collectionConfig.admin &&
        'description' in collectionConfig.admin &&
        ((isReactComponent<EntityDescriptionComponent>(collectionConfig.admin.description) &&
          collectionConfig.admin.description) ||
          (collectionConfig.admin.description && ViewDescription))) ||
      undefined

    const Description =
      DescriptionComponent !== undefined ? (
        <DescriptionComponent {...(descriptionProps || {})} />
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
      actionsMap: mapActions({
        collectionConfig,
      }),
      fieldMap: mapFields({
        config,
        fieldSchema: fields,
        i18n,
        readOnly: readOnlyOverride,
      }),
      isPreviewEnabled: !!collectionConfig?.admin?.preview,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})
