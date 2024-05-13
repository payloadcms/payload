import type { I18nClient } from '@payloadcms/translations'
import type {
  EditViewProps,
  SanitizedConfig,
  SanitizedGlobalConfig,
  WithServerSideProps,
} from 'payload/types'

import { ViewDescription, type ViewDescriptionProps } from '@payloadcms/ui/elements/ViewDescription'
import React from 'react'

import type { GlobalComponentMap } from './types.js'

import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapGlobals = ({
  args,
}: {
  args: {
    DefaultEditView: React.FC<EditViewProps>
    WithServerSideProps: WithServerSideProps
    config: SanitizedConfig
    globals: SanitizedGlobalConfig[]
    i18n: I18nClient
    readOnly?: boolean
  }
}): {
  [key: SanitizedGlobalConfig['slug']]: GlobalComponentMap
} => {
  const {
    DefaultEditView,
    WithServerSideProps,
    config,
    globals,
    i18n,
    i18n: { t },
    readOnly: readOnlyOverride,
  } = args

  return globals.reduce((acc, globalConfig) => {
    const { slug, fields } = globalConfig

    const editViewFromConfig = globalConfig?.admin?.components?.views?.Edit

    const SaveButton = globalConfig?.admin?.components?.elements?.SaveButton

    const SaveButtonComponent = SaveButton ? (
      <WithServerSideProps Component={SaveButton} />
    ) : undefined

    const SaveDraftButton = globalConfig?.admin?.components?.elements?.SaveDraftButton

    const SaveDraftButtonComponent = SaveDraftButton ? (
      <WithServerSideProps Component={SaveDraftButton} />
    ) : undefined

    const PreviewButton = globalConfig?.admin?.components?.elements?.PreviewButton

    const PreviewButtonComponent = PreviewButton ? (
      <WithServerSideProps Component={PreviewButton} />
    ) : undefined

    const PublishButton = globalConfig?.admin?.components?.elements?.PublishButton

    const PublishButtonComponent = PublishButton ? (
      <WithServerSideProps Component={PublishButton} />
    ) : undefined

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
    const DescriptionComponent =
      globalConfig.admin?.components?.elements?.Description ||
      (description ? ViewDescription : undefined)

    const Description =
      DescriptionComponent !== undefined ? (
        <WithServerSideProps Component={DescriptionComponent} {...(descriptionProps || {})} />
      ) : undefined

    const componentMap: GlobalComponentMap = {
      Description,
      Edit: <Edit globalSlug={globalConfig.slug} />,
      PreviewButton: PreviewButtonComponent,
      PublishButton: PublishButtonComponent,
      SaveButton: SaveButtonComponent,
      SaveDraftButton: SaveDraftButtonComponent,
      actionsMap: mapActions({
        WithServerSideProps,
        globalConfig,
      }),
      fieldMap: mapFields({
        WithServerSideProps,
        config,
        fieldSchema: fields,
        i18n,
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
