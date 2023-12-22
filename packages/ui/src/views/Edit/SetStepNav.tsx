'use client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'
import type { StepNavItem } from '../../elements/StepNav/types'

import { getTranslation } from 'payload/utilities'
import { useStepNav } from '../../elements/StepNav'
import { useConfig } from '../../providers/Config'
import { useEditDepth } from '../../providers/EditDepth'

export const SetStepNav: React.FC<{
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalSlug?: SanitizedGlobalConfig['slug']
  pluralLabel?: SanitizedCollectionConfig['labels']['plural']
  useAsTitle?: string | undefined
  id?: number | string
  isEditing: boolean
  view?: string
}> = (props) => {
  const { collectionSlug, globalSlug, pluralLabel, useAsTitle, id, isEditing } = props
  const view: string | undefined = props?.view || undefined

  let title = ''
  // const title = useTitle({ collection, global })

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation('general')

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
          label: t('createNew'),
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
