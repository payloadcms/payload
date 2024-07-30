import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewProps,
  EditViewComponent,
  EditViewProps,
  ImportMap,
  MappedComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  ServerSideEditViewProps,
} from 'payload'
import type React from 'react'

import type { ViewDescriptionProps } from '../../../elements/ViewDescription/index.js'
import type { CreateMappedComponent } from './index.js'
import type { CollectionComponentMap } from './types.js'

// Need to import from client barrel file
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ViewDescription } from '../../../exports/client/index.js'
import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapCollections = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  collections: SanitizedCollectionConfig[]
  config: SanitizedConfig
  createMappedComponent: CreateMappedComponent
  i18n: I18nClient
  importMap: ImportMap
  readOnly?: boolean
}): {
  [key: SanitizedCollectionConfig['slug']]: CollectionComponentMap
} => {
  const {
    DefaultEditView,
    DefaultListView,
    collections,
    config,
    createMappedComponent,
    i18n,
    i18n: { t },
    importMap,
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

    const EditView: MappedComponent<ServerSideEditViewProps> = createMappedComponent(
      editViewFromConfig?.Default && 'Component' in editViewFromConfig.Default
        ? (editViewFromConfig.Default?.Component as EditViewComponent)
        : null,
      {
        collectionSlug: collectionConfig.slug,
      },
      DefaultEditView,
    )
    const ListView: MappedComponent = createMappedComponent(
      listViewFromConfig?.Component,
      {
        collectionSlug: collectionConfig.slug,
      },
      DefaultListView,
    )

    const SaveButton = createMappedComponent(collectionConfig?.admin?.components?.edit?.SaveButton)

    const SaveDraftButton = createMappedComponent(
      collectionConfig?.admin?.components?.edit?.SaveDraftButton,
    )

    const PreviewButton = createMappedComponent(
      collectionConfig?.admin?.components?.edit?.PreviewButton,
    )

    const PublishButton = createMappedComponent(
      collectionConfig?.admin?.components?.edit?.PublishButton,
    )

    const Upload = createMappedComponent(collectionConfig?.admin?.components?.edit?.Upload)

    const BeforeList = createMappedComponent(collectionConfig?.admin?.components?.beforeList)

    const BeforeListTable = createMappedComponent(
      collectionConfig?.admin?.components?.beforeListTable,
    )

    const AfterList = createMappedComponent(collectionConfig?.admin?.components?.afterList)

    const AfterListTable = createMappedComponent(
      collectionConfig?.admin?.components?.afterListTable,
    )

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

    const Description = createMappedComponent(
      collectionConfig.admin?.components?.edit?.Description,
      descriptionProps,
      description ? ViewDescription : undefined,
    )

    const componentMap: CollectionComponentMap = {
      AfterList,
      AfterListTable,
      BeforeList,
      BeforeListTable,
      Description,
      Edit: EditView,
      List: ListView,
      PreviewButton,
      PublishButton,
      SaveButton,
      SaveDraftButton,
      Upload,
      actionsMap: mapActions({
        collectionConfig,
        createMappedComponent,
        importMap,
      }),
      fieldMap: mapFields({
        config,
        createMappedComponent,
        fieldSchema: fields,
        i18n,
        importMap,
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
