import type { I18n } from '@payloadcms/translations'
import type {
  EditViewProps,
  EntityDescriptionComponent,
  EntityDescriptionFunction,
  SanitizedConfig,
  SanitizedGlobalConfig,
  WithServerSideProps as WithServerSidePropsType,
} from 'payload/types'

import { ViewDescription, type ViewDescriptionProps } from '@payloadcms/ui/elements/ViewDescription'
import { isPlainFunction, isReactComponent } from 'payload/utilities'
import React from 'react'

import type { GlobalComponentMap } from './types.js'

import { mapActions } from './actions.js'
import { mapFields } from './fields.js'

export const mapGlobals = ({
  DefaultEditView,
  WithServerSideProps,
  config,
  globals,
  i18n,
  readOnly: readOnlyOverride,
}: {
  DefaultEditView: React.FC<EditViewProps>
  WithServerSideProps: WithServerSidePropsType
  config: SanitizedConfig
  globals: SanitizedGlobalConfig[]
  i18n: I18n
  readOnly?: boolean
}): {
  [key: SanitizedGlobalConfig['slug']]: GlobalComponentMap
} =>
  globals.reduce((acc, globalConfig) => {
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

    const descriptionProps: ViewDescriptionProps = {
      description:
        (globalConfig.admin &&
          'description' in globalConfig.admin &&
          (((typeof globalConfig.admin?.description === 'string' ||
            typeof globalConfig.admin?.description === 'object') &&
            globalConfig.admin.description) ||
            (typeof globalConfig.admin?.description === 'function' &&
              isPlainFunction<EntityDescriptionFunction>(globalConfig.admin?.description) &&
              globalConfig.admin?.description()))) ||
        undefined,
    }

    const DescriptionComponent =
      (globalConfig.admin &&
        'description' in globalConfig.admin &&
        ((isReactComponent<EntityDescriptionComponent>(globalConfig.admin.description) &&
          globalConfig.admin.description) ||
          (globalConfig.admin.description && ViewDescription))) ||
      undefined

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
