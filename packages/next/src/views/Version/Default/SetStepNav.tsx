'use client'

import type { ClientCollectionConfig, ClientGlobalConfig, TypeWithVersion } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useLocale, useStepNav, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { fieldAffectsData, formatAdminURL } from 'payload/shared'
import { useEffect } from 'react'

export const SetStepNav: React.FC<{
  readonly collectionConfig?: ClientCollectionConfig
  readonly doc: TypeWithVersion<unknown>
  readonly globalConfig?: ClientGlobalConfig
  readonly id?: number | string
}> = ({ id, collectionConfig, doc, globalConfig }) => {
  const { config } = useConfig()
  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation()
  const locale = useLocale()

  useEffect(() => {
    const {
      admin: { dateFormat },
      routes: { admin: adminRoute },
    } = config

    const createdAtLabel = doc?.createdAt
      ? formatDate({ date: doc.createdAt, i18n, pattern: dateFormat })
      : ''

    if (collectionConfig) {
      const collectionSlug = collectionConfig.slug

      const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'
      const pluralLabel = collectionConfig.labels?.plural
      let docLabel = `[${t('general:untitled')}]`

      if (doc.version) {
        const versionTitle = doc.version[useAsTitle]
        const fields = collectionConfig.fields

        const titleField = fields.find(
          (f) => fieldAffectsData(f) && 'name' in f && f.name === useAsTitle,
        )

        if (titleField && versionTitle) {
          docLabel =
            'localized' in titleField && titleField.localized
              ? versionTitle?.[locale.code] || docLabel
              : versionTitle
        } else if (useAsTitle === 'id') {
          docLabel = doc.id
        }
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
          label: createdAtLabel,
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
          label: createdAtLabel,
        },
      ])
    }
  }, [config, setStepNav, doc, id, locale, t, i18n, collectionConfig, globalConfig])

  return null
}
