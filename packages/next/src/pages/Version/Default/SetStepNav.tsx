import { getTranslation } from '@payloadcms/translations'
import {
  FieldMap,
  StepNavItem,
  formatDate,
  useConfig,
  useLocale,
  useStepNav,
  useTranslation,
} from '@payloadcms/ui'
import { FieldAffectingData, SanitizedCollectionConfig } from 'payload/types'
import React, { useEffect } from 'react'

export const SetStepNav: React.FC<{
  collectionSlug?: string
  globalSlug?: string
  mostRecentDoc: any
  doc: any
  id?: string | number
  fieldMap: FieldMap
  collectionConfig?: SanitizedCollectionConfig
}> = ({ collectionSlug, globalSlug, mostRecentDoc, doc, id, fieldMap, collectionConfig }) => {
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
          const titleField = fieldMap.find(
            ({ isFieldAffectingData, name: fieldName }) =>
              isFieldAffectingData && fieldName === useAsTitle,
          ) as FieldAffectingData

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
