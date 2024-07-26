import type { I18nClient } from '@payloadcms/translations'
import type {
  EditViewProps,
  ImportMap,
  MappedComponent,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'
import type React from 'react'

import type { ViewDescriptionProps } from '../../../elements/ViewDescription/index.js'
import type { CreateMappedComponent } from './index.js'
import type { GlobalComponentMap } from './types.js'

// Need to import from client barrel file
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ViewDescription } from '../../../exports/client/index.js'
import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapGlobals = ({
  args,
}: {
  args: {
    DefaultEditView: React.FC<EditViewProps>
    config: SanitizedConfig
    createMappedComponent: CreateMappedComponent
    globals: SanitizedGlobalConfig[]
    i18n: I18nClient
    importMap: ImportMap
    readOnly?: boolean
  }
}): {
  [key: SanitizedGlobalConfig['slug']]: GlobalComponentMap
} => {
  const {
    DefaultEditView,
    config,
    createMappedComponent,
    globals,
    i18n,
    i18n: { t },
    importMap,
    readOnly: readOnlyOverride,
  } = args

  return globals.reduce((acc, globalConfig) => {
    const { slug, fields } = globalConfig

    const SaveButtonComponent = createMappedComponent(
      globalConfig?.admin?.components?.elements?.SaveButton,
    )

    const SaveDraftButtonComponent = createMappedComponent(
      globalConfig?.admin?.components?.elements?.SaveDraftButton,
    )

    const PreviewButtonComponent = createMappedComponent(
      globalConfig?.admin?.components?.elements?.PreviewButton,
    )

    const PublishButtonComponent = createMappedComponent(
      globalConfig?.admin?.components?.elements?.PublishButton,
    )

    const editViewFromConfig = globalConfig?.admin?.components?.views?.Edit

    const Edit: MappedComponent<EditViewProps> = createMappedComponent(
      editViewFromConfig?.Default && 'Component' in editViewFromConfig.Default
        ? editViewFromConfig.Default
        : undefined,
      { globalSlug: globalConfig.slug },
      DefaultEditView,
    )

    let description = undefined
    if (globalConfig.admin && 'description' in globalConfig.admin) {
      if (
        typeof globalConfig.admin?.description === 'string' ||
        typeof globalConfig.admin?.description === 'object'
      ) {
        description = globalConfig.admin.description
      } else if (typeof globalConfig.admin?.description === 'function') {
        description = globalConfig.admin?.description({ t })
      }
    }

    const descriptionProps: ViewDescriptionProps = {
      description,
    }

    const Description = createMappedComponent(
      globalConfig.admin?.components?.elements?.Description,
      descriptionProps,
      description ? ViewDescription : undefined,
    )

    const componentMap: GlobalComponentMap = {
      Description,
      Edit,
      PreviewButton: PreviewButtonComponent,
      PublishButton: PublishButtonComponent,
      SaveButton: SaveButtonComponent,
      SaveDraftButton: SaveDraftButtonComponent,
      Upload: null,
      actionsMap: mapActions({
        createMappedComponent,
        globalConfig,
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
      isPreviewEnabled: !!globalConfig?.admin?.preview,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})
}
