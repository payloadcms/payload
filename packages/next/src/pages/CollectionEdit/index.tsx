import { SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import { initPage } from '../../utilities/initPage'
import {
  EditDepthProvider,
  RenderCustomComponent,
  DefaultEdit,
  DefaultEditViewProps,
  findLocaleFromCode,
  fieldTypes,
  buildStateFromSchema,
  formatFields,
  FormQueryParamsProvider,
  QueryParamTypes,
  HydrateClientUser,
} from '@payloadcms/ui'
import queryString from 'qs'

export const CollectionEdit = async ({
  collectionSlug,
  id,
  config: configPromise,
  searchParams,
  isEditing = true,
}: {
  collectionSlug: string
  id?: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
  isEditing?: boolean
}) => {
  const { config, payload, permissions, user } = await initPage(configPromise)

  const {
    routes: { api },
    serverURL,
    localization,
  } = config

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  if (collectionConfig) {
    const {
      admin: { components: { views: { Edit: CustomEdit } = {} } = {} },
    } = collectionConfig

    const data = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 0,
      user,
    })

    const defaultLocale =
      localization && localization.defaultLocale ? localization.defaultLocale : 'en'

    const localeCode = (searchParams?.locale as string) || defaultLocale

    const locale = localization && findLocaleFromCode(localization, localeCode)

    const collectionPermissions = permissions?.collections?.[collectionSlug]

    const fieldSchema = formatFields(collectionConfig, isEditing)

    let preferencesKey: string

    if (id) {
      preferencesKey = `collection-${collectionSlug}-${id}`
    }

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
      id,
      config: collectionConfig,
      data: data || {},
      fieldSchema,
      locale,
      operation: isEditing ? 'update' : 'create',
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

    const componentProps: DefaultEditViewProps = {
      id,
      action: `${serverURL}${api}/${collectionSlug}${
        isEditing ? `/${id}` : ''
      }?${queryString.stringify(formQueryParams)}`,
      apiURL: `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}${
        collectionConfig.versions.drafts ? '&draft=true' : ''
      }`,
      canAccessAdmin: permissions?.canAccessAdmin,
      config,
      collectionConfig,
      data,
      fieldTypes,
      hasSavePermission:
        (isEditing && collectionPermissions?.update?.permission) ||
        (!isEditing && collectionPermissions?.create?.permission),
      internalState: state,
      isEditing,
      permissions: collectionPermissions,
      updatedAt: data?.updatedAt.toString(),
      user,
      onSave: () => {},
      isLoading: false,
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} />
        <EditDepthProvider depth={1}>
          <FormQueryParamsProvider formQueryParams={formQueryParams}>
            <RenderCustomComponent
              CustomComponent={typeof CustomEdit === 'function' ? CustomEdit : undefined}
              DefaultComponent={DefaultEdit}
              componentProps={componentProps}
            />
          </FormQueryParamsProvider>
        </EditDepthProvider>
      </Fragment>
    )
  }

  return null
}
