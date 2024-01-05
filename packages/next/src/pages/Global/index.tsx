import { SanitizedConfig, TypeWithID } from 'payload/types'
import React, { Fragment } from 'react'
import { initPage } from '../../utilities/initPage'
import {
  EditDepthProvider,
  RenderCustomComponent,
  DefaultGlobalViewProps,
  findLocaleFromCode,
  DefaultGlobalView,
  fieldTypes,
  buildStateFromSchema,
  formatFields,
  FormQueryParamsProvider,
  QueryParamTypes,
  HydrateClientUser,
  DocumentInfoProvider,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'
// import i18n from 'i18next'
// import { getTranslation } from 'payload/utilities'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    // title: getTranslation(label, i18n),
    // description: getTranslation(label, i18n),
    // keywords: `${getTranslation(label, i18n)}, Payload, CMS`,
    title: '',
    description: '',
    keywords: '',
    config,
  })

export const Global = async ({
  globalSlug,
  config: configPromise,
  searchParams,
}: {
  globalSlug: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user } = await initPage(configPromise, true)

  const {
    routes: { api },
    serverURL,
    localization,
  } = config

  const globalConfig = config.globals.find((global) => global.slug === globalSlug)

  if (globalConfig) {
    const {
      admin: { components: { views: { Edit: CustomEdit } = {} } = {} },
      fields,
    } = globalConfig

    let data: TypeWithID & Record<string, unknown>

    try {
      data = await payload.findGlobal({
        slug: globalSlug,
        depth: 0,
        user,
      })
    } catch (error) {}

    const defaultLocale =
      localization && localization.defaultLocale ? localization.defaultLocale : 'en'

    const localeCode = (searchParams?.locale as string) || defaultLocale

    const locale = localization && findLocaleFromCode(localization, localeCode)

    const globalPermission = permissions?.globals?.[globalSlug]

    const fieldSchema = formatFields(fields, true)

    const preferencesKey = `global-${globalSlug}`

    const {
      docs: [preferences],
    } = await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      pagination: false,
      user,
      limit: 1,
      where: {
        key: {
          equals: preferencesKey,
        },
      },
    })

    const state = await buildStateFromSchema({
      config,
      data: data || {},
      fieldSchema,
      locale,
      operation: 'update',
      preferences,
      // t,
      user,
    })

    const formQueryParams: QueryParamTypes = {
      depth: 0,
      'fallback-locale': 'null',
      locale: '',
      uploadEdits: undefined,
    }

    const componentProps: DefaultGlobalViewProps = {
      action: `${serverURL}${api}/globals/${globalSlug}?locale=${locale}&fallback-locale=null`,
      apiURL: `${serverURL}${api}/globals/${globalSlug}?locale=${locale}${
        global.versions?.drafts ? '&draft=true' : ''
      }`,
      canAccessAdmin: permissions?.canAccessAdmin,
      config,
      globalConfig,
      data,
      fieldTypes,
      initialState: state,
      permissions: globalPermission,
      updatedAt: data?.updatedAt?.toString(),
      user,
      onSave: () => {},
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} />
        <DocumentInfoProvider
          collectionSlug={globalConfig.slug}
          key={`${globalSlug}-${locale}`}
          versionsEnabled={Boolean(globalConfig.versions)}
          draftsEnabled={Boolean(globalConfig.versions?.drafts)}
        >
          <EditDepthProvider depth={1}>
            <FormQueryParamsProvider formQueryParams={formQueryParams}>
              <RenderCustomComponent
                CustomComponent={typeof CustomEdit === 'function' ? CustomEdit : undefined}
                DefaultComponent={DefaultGlobalView}
                componentProps={componentProps}
              />
            </FormQueryParamsProvider>
          </EditDepthProvider>
        </DocumentInfoProvider>
      </Fragment>
    )
  }

  return notFound()
}
