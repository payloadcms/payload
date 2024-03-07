'use client'
import type { StepNavItem } from '@payloadcms/ui'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import {
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useStepNav,
  useTranslation,
} from '@payloadcms/ui'
import { useEffect } from 'react'

export const SetStepNav: React.FC<{
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  pluralLabel?: SanitizedCollectionConfig['labels']['plural']
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  view?: string
}> = (props) => {
  const { id, collectionSlug, globalSlug, pluralLabel, useAsTitle } = props

  const view: string | undefined = props?.view || undefined

  const { isEditing, title } = useDocumentInfo()

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation()

  const {
    routes: { admin },
  } = useConfig()

  const drawerDepth = useEditDepth()

  useEffect(() => {
    const nav: StepNavItem[] = []

    if (collectionSlug) {
      nav.push({
        label: getTranslation(pluralLabel, i18n),
        url: `${admin}/collections/${collectionSlug}`,
      })

      if (isEditing) {
        nav.push({
          label: (useAsTitle && useAsTitle !== 'id' && title) || `${id}`,
          url: `${admin}/collections/${collectionSlug}/${id}`,
        })
      } else {
        nav.push({
          label: t('general:createNew'),
        })
      }
    } else if (globalSlug) {
      nav.push({
        label: title,
        url: `${admin}/globals/${globalSlug}`,
      })
    }

    if (view) {
      nav.push({
        label: view,
      })
    }

    if (drawerDepth <= 1) setStepNav(nav)
  }, [
    setStepNav,
    isEditing,
    pluralLabel,
    id,
    useAsTitle,
    admin,
    t,
    i18n,
    title,
    collectionSlug,
    globalSlug,
    view,
    drawerDepth,
  ])

  return null
}
