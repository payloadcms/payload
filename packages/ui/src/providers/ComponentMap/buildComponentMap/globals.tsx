import type { I18nClient } from '@payloadcms/translations'
import type {
  ComponentImportMap,
  EditViewProps,
  ResolvedComponent,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import React from 'react'

import type { ViewDescriptionProps } from '../../../elements/ViewDescription/index.js'
import type { WithServerSidePropsPrePopulated } from './index.js'
import type { GlobalComponentMap } from './types.js'

// Need to import from client barrel file
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ViewDescription } from '../../../exports/client/index.js'
import { mapActions } from './actions.js'
import { mapFields } from './fields.js'
import { getComponent } from './getComponent.js'

export const mapGlobals = ({
  args,
}: {
  args: {
    DefaultEditView: React.FC<EditViewProps>
    WithServerSideProps: WithServerSidePropsPrePopulated
    componentImportMap: ComponentImportMap
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
    componentImportMap,
    config,
    globals,
    i18n,
    i18n: { t },
    readOnly: readOnlyOverride,
  } = args

  return globals.reduce((acc, globalConfig) => {
    const { slug, fields } = globalConfig

    const SaveButton = getComponent({
      componentImportMap,
      payloadComponent: globalConfig?.admin?.components?.elements?.SaveButton,
    })

    const SaveButtonComponent = SaveButton?.component ? (
      <WithServerSideProps Component={SaveButton} />
    ) : undefined

    const SaveDraftButton = getComponent({
      componentImportMap,
      payloadComponent: globalConfig?.admin?.components?.elements?.SaveDraftButton,
    })

    const SaveDraftButtonComponent = SaveDraftButton?.component ? (
      <WithServerSideProps Component={SaveDraftButton} />
    ) : undefined

    const PreviewButton = getComponent({
      componentImportMap,
      payloadComponent: globalConfig?.admin?.components?.elements?.PreviewButton,
    })

    const PreviewButtonComponent = PreviewButton?.component ? (
      <WithServerSideProps Component={PreviewButton} />
    ) : undefined

    const PublishButton = getComponent({
      componentImportMap,
      payloadComponent: globalConfig?.admin?.components?.elements?.PublishButton,
    })

    const PublishButtonComponent = PublishButton?.component ? (
      <WithServerSideProps Component={PublishButton} />
    ) : undefined

    const editViewFromConfig = globalConfig?.admin?.components?.views?.Edit

    let CustomEditView: ResolvedComponent<EditViewProps, EditViewProps> = undefined

    if (editViewFromConfig?.Default && 'Component' in editViewFromConfig.Default) {
      CustomEditView = getComponent({
        componentImportMap,
        payloadComponent: editViewFromConfig.Default,
      })
    }

    const Edit: React.FC<EditViewProps> = CustomEditView?.component || DefaultEditView

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
      getComponent({
        componentImportMap,
        payloadComponent: globalConfig.admin?.components?.elements?.Description,
      }) || (description ? { component: ViewDescription } : undefined)

    const Description = DescriptionComponent?.component ? (
      <WithServerSideProps Component={DescriptionComponent} {...(descriptionProps || {})} />
    ) : undefined

    const componentMap: GlobalComponentMap = {
      Description,
      Edit: <Edit globalSlug={globalConfig.slug} />,
      PreviewButton: PreviewButtonComponent,
      PublishButton: PublishButtonComponent,
      SaveButton: SaveButtonComponent,
      SaveDraftButton: SaveDraftButtonComponent,
      Upload: null,
      actionsMap: mapActions({
        WithServerSideProps,
        componentImportMap,
        globalConfig,
      }),
      fieldMap: mapFields({
        WithServerSideProps,
        componentImportMap,
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
