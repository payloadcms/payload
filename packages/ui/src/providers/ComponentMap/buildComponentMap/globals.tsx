import type { EditViewProps, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'

import React from 'react'

import type { GlobalComponentMap } from './types.js'

import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapGlobals = ({
  DefaultEditView,
  config,
  globals,
  readOnly: readOnlyOverride,
}: {
  DefaultEditView: React.FC<EditViewProps>
  config: SanitizedConfig
  globals: SanitizedGlobalConfig[]
  readOnly?: boolean
}): {
  [key: SanitizedGlobalConfig['slug']]: GlobalComponentMap
} =>
  globals.reduce((acc, globalConfig) => {
    const { slug, fields } = globalConfig

    const editViewFromConfig = globalConfig?.admin?.components?.views?.Edit

    const SaveButton = globalConfig?.admin?.components?.elements?.SaveButton
    const SaveButtonComponent = SaveButton ? <SaveButton /> : undefined

    const SaveDraftButton = globalConfig?.admin?.components?.elements?.SaveDraftButton
    const SaveDraftButtonComponent = SaveDraftButton ? <SaveDraftButton /> : undefined

    const PreviewButton = globalConfig?.admin?.components?.elements?.PreviewButton
    const PreviewButtonComponent = PreviewButton ? <PreviewButton /> : undefined

    const PublishButton = globalConfig?.admin?.components?.elements?.PublishButton
    const PublishButtonComponent = PublishButton ? <PublishButton /> : undefined

    const CustomEditView =
      typeof editViewFromConfig === 'function'
        ? editViewFromConfig
        : typeof editViewFromConfig === 'object' && typeof editViewFromConfig.Default === 'function'
          ? editViewFromConfig.Default
          : typeof editViewFromConfig?.Default === 'object' &&
              'Component' in editViewFromConfig.Default &&
              typeof editViewFromConfig.Default.Component === 'function'
            ? editViewFromConfig.Default.Component
            : undefined

    const Edit = (CustomEditView as React.FC<EditViewProps>) || DefaultEditView

    const componentMap: GlobalComponentMap = {
      Edit: <Edit globalSlug={globalConfig.slug} />,
      PreviewButton: PreviewButtonComponent,
      PublishButton: PublishButtonComponent,
      SaveButton: SaveButtonComponent,
      SaveDraftButton: SaveDraftButtonComponent,
      actionsMap: mapActions({
        globalConfig,
      }),
      fieldMap: mapFields({
        config,
        fieldSchema: fields,
        readOnly: readOnlyOverride,
      }),
      isPreviewEnabled: !!globalConfig?.admin?.preview,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})
