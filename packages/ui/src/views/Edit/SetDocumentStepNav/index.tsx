'use client'
import type { CollectionConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useEffect } from 'react'

import type { StepNavItem } from '../../../elements/StepNav/index.js'

import { useStepNav } from '../../../elements/StepNav/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../../providers/EditDepth/index.js'
import { useEntityVisibility } from '../../../providers/EntityVisibility/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'

export const SetDocumentStepNav: React.FC<{
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  pluralLabel?: CollectionConfig['labels']['plural']
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  view?: string
}> = (props) => {
  const { id, collectionSlug, globalSlug, pluralLabel, useAsTitle } = props

  const view: string | undefined = props?.view || undefined

  const { isEditing, isInitializing, title } = useDocumentInfo()
  const { isEntityVisible } = useEntityVisibility()
  const isVisible = isEntityVisible({ collectionSlug, globalSlug })

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const drawerDepth = useEditDepth()

  useEffect(() => {
    const nav: StepNavItem[] = []

    if (!isInitializing) {
      if (collectionSlug) {
        nav.push({
          label: getTranslation(pluralLabel, i18n),
          url: isVisible
            ? formatAdminURL({
                adminRoute,
                path: `/collections/${collectionSlug}`,
              })
            : undefined,
        })

        if (isEditing) {
          nav.push({
            label: (useAsTitle && useAsTitle !== 'id' && title) || `${id}`,
            url: isVisible
              ? formatAdminURL({
                  adminRoute,
                  path: `/collections/${collectionSlug}/${id}`,
                })
              : undefined,
          })
        } else {
          nav.push({
            label: t('general:createNew'),
          })
        }
      } else if (globalSlug) {
        nav.push({
          label: title,
          url: isVisible
            ? formatAdminURL({
                adminRoute,
                path: `/globals/${globalSlug}`,
              })
            : undefined,
        })
      }

      if (view) {
        nav.push({
          label: view,
        })
      }

      if (drawerDepth <= 1) {
        setStepNav(nav)
      }
    }
  }, [
    setStepNav,
    isInitializing,
    isEditing,
    pluralLabel,
    id,
    useAsTitle,
    adminRoute,
    t,
    i18n,
    title,
    collectionSlug,
    globalSlug,
    view,
    drawerDepth,
    isVisible,
  ])

  return null
}
