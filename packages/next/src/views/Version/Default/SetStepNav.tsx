import type { FieldMap, StepNavItem } from '@payloadcms/ui'
import type { FieldAffectingData, SanitizedCollectionConfig } from 'payload/types'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { formatDate, useConfig, useLocale, useStepNav, useTranslation } from '@payloadcms/ui'
import { useEffect } from 'react'

export const SetStepNav: React.FC<{
  collectionConfig?: SanitizedCollectionConfig
  collectionSlug?: string
  doc: any
  fieldMap: FieldMap
  globalSlug?: string
  id?: number | string
  mostRecentDoc: any
}> = ({ id, collectionConfig, collectionSlug, doc, fieldMap, globalSlug, mostRecentDoc }) => {
  const config = useConfig()
  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation()
  const locale = useLocale()

  useEffect(() => {
    let nav: StepNavItem[] = []

    const {
      admin: { dateFormat },
      routes: { admin: adminRoute },
    } = config

    if (collectionSlug) {
      let docLabel = ''

      const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
      const pluralLabel = collectionConfig?.labels?.plural

      if (mostRecentDoc) {
        if (useAsTitle !== 'id') {
          const titleField = fieldMap.find((f) => {
            const { isFieldAffectingData } = f
            const fieldName = 'name' in f ? f.name : undefined
            return isFieldAffectingData && fieldName === useAsTitle
          }) as FieldAffectingData

          if (titleField && mostRecentDoc[useAsTitle]) {
            if (titleField.localized) {
              docLabel = mostRecentDoc[useAsTitle]?.[locale.code]
            } else {
              docLabel = mostRecentDoc[useAsTitle]
            }
          } else {
            docLabel = `[${t('general:untitled')}]`
          }
        } else {
          docLabel = mostRecentDoc.id
        }
      }

      nav = [
        {
          label: getTranslation(pluralLabel, i18n),
          url: `${adminRoute}/collections/${collectionSlug}`,
        },
        {
          label: docLabel,
          url: `${adminRoute}/collections/${collectionSlug}/${id}`,
        },
        {
          label: 'Versions',
          url: `${adminRoute}/collections/${collectionSlug}/${id}/versions`,
        },
        {
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
        },
      ]
    }

    if (globalSlug) {
      nav = [
        {
          label: global.label,
          url: `${adminRoute}/globals/${global.slug}`,
        },
        {
          label: 'Versions',
          url: `${adminRoute}/globals/${global.slug}/versions`,
        },
        {
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
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
    mostRecentDoc,
    id,
    locale,
    t,
    i18n,
    collectionConfig,
  ])

  return null
}
