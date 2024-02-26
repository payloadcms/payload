'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { useEffect } from 'react'

import type { StepNavItem } from '../../../elements/StepNav/types'

import { useStepNav } from '../../../elements/StepNav'
import { useConfig } from '../../../providers/Config'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { useEditDepth } from '../../../providers/EditDepth'
import { useTranslation } from '../../../providers/Translation'

export const SetStepNav: React.FC<{
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  isEditing?: boolean
  pluralLabel?: SanitizedCollectionConfig['labels']['plural']
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  view?: string
}> = (props) => {
  const { id, collectionSlug, globalSlug, isEditing = true, pluralLabel, useAsTitle } = props

  const view: string | undefined = props?.view || undefined

  const { title } = useDocumentInfo()

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
