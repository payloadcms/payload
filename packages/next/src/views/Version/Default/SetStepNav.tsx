'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useLocale, useStepNav, useTranslation } from '@payloadcms/ui'
import { fieldAffectsData, formatAdminURL } from 'payload/shared'
import { useEffect } from 'react'

export const SetStepNav: React.FC<{
  readonly collectionConfig?: ClientCollectionConfig
  readonly globalConfig?: ClientGlobalConfig
  readonly id?: number | string
  versionToCreatedAtFormatted?: string
  versionToID?: string
  versionToUseAsTitle?: string
}> = ({
  id,
  collectionConfig,
  globalConfig,
  versionToCreatedAtFormatted,
  versionToID,
  versionToUseAsTitle,
}) => {
  const { config } = useConfig()
  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation()
  const locale = useLocale()

  useEffect(() => {
    const {
      routes: { admin: adminRoute },
    } = config

    if (collectionConfig) {
      const collectionSlug = collectionConfig.slug

      const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'
      const pluralLabel = collectionConfig.labels?.plural
      let docLabel = `[${t('general:untitled')}]`

      const fields = collectionConfig.fields

      const titleField = fields.find(
        (f) => fieldAffectsData(f) && 'name' in f && f.name === useAsTitle,
      )

      if (titleField && versionToUseAsTitle) {
        docLabel =
          'localized' in titleField && titleField.localized
            ? versionToUseAsTitle?.[locale.code] || docLabel
            : versionToUseAsTitle
      } else if (useAsTitle === 'id') {
        docLabel = versionToID
      }

      setStepNav([
        {
          label: getTranslation(pluralLabel, i18n),
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}`,
          }),
        },
        {
          label: docLabel,
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/${id}`,
          }),
        },
        {
          label: 'Versions',
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/${id}/versions`,
          }),
        },
        {
          label: versionToCreatedAtFormatted,
        },
      ])
      return
    }

    if (globalConfig) {
      const globalSlug = globalConfig.slug

      setStepNav([
        {
          label: globalConfig.label,
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalSlug}`,
          }),
        },
        {
          label: 'Versions',
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalSlug}/versions`,
          }),
        },
        {
          label: versionToCreatedAtFormatted,
        },
      ])
    }
  }, [
    config,
    setStepNav,
    id,
    locale,
    t,
    i18n,
    collectionConfig,
    globalConfig,
    versionToUseAsTitle,
    versionToCreatedAtFormatted,
    versionToID,
  ])

  return null
}
