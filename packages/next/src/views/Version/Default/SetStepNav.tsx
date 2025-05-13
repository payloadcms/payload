'use client'
import type { StepNavItem } from '@payloadcms/ui'
import type { ClientCollectionConfig, ClientField, ClientGlobalConfig } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useLocale, useStepNav, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { fieldAffectsData, formatAdminURL } from 'payload/shared'
import { useEffect } from 'react'

export const SetStepNav: React.FC<{
  readonly collectionConfig?: ClientCollectionConfig
  readonly collectionSlug?: string
  readonly doc: any
  readonly fields: ClientField[]
  readonly globalConfig?: ClientGlobalConfig
  readonly globalSlug?: string
  readonly id?: number | string
}> = ({ id, collectionConfig, collectionSlug, doc, fields, globalConfig, globalSlug }) => {
  const { config } = useConfig()
  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation()
  const locale = useLocale()

  useEffect(() => {
    let nav: StepNavItem[] = []

    const {
      admin: { dateFormat },
      routes: { admin: adminRoute },
    } = config

    if (collectionSlug && collectionConfig) {
      let docLabel = ''

      const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
      const pluralLabel = collectionConfig?.labels?.plural
      const formattedDoc = doc.version ? doc.version : doc

      if (formattedDoc) {
        if (useAsTitle !== 'id') {
          const titleField = fields.find((f) => {
            const fieldName = 'name' in f ? f.name : undefined
            return Boolean(fieldAffectsData(f) && fieldName === useAsTitle)
          })

          if (titleField && formattedDoc[useAsTitle]) {
            if ('localized' in titleField && titleField.localized) {
              docLabel = formattedDoc[useAsTitle]?.[locale.code]
            } else {
              docLabel = formattedDoc[useAsTitle]
            }
          } else {
            docLabel = `[${t('general:untitled')}]`
          }
        } else {
          docLabel = doc.id
        }
      }

      nav = [
        {
          label: getTranslation(pluralLabel, i18n),
          url: formatAdminURL({ adminRoute, path: `/collections/${collectionSlug}` }),
        },
        {
          label: docLabel,
          url: formatAdminURL({ adminRoute, path: `/collections/${collectionSlug}/${id}` }),
        },
        {
          label: 'Versions',
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/${id}/versions`,
          }),
        },
        {
          label: doc?.createdAt
            ? formatDate({ date: doc.createdAt, i18n, pattern: dateFormat })
            : '',
        },
      ]
    }

    if (globalSlug && globalConfig) {
      nav = [
        {
          label: globalConfig.label,
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalConfig.slug}`,
          }),
        },
        {
          label: 'Versions',
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalConfig.slug}/versions`,
          }),
        },
        {
          label: doc?.createdAt
            ? formatDate({ date: doc.createdAt, i18n, pattern: dateFormat })
            : '',
        },
      ]
    }

    setStepNav(nav)
  }, [
    config,
    setStepNav,
    collectionSlug,
    globalSlug,
    doc,
    id,
    locale,
    t,
    i18n,
    collectionConfig,
    fields,
    globalConfig,
  ])

  return null
}
