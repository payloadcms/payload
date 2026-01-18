'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import { useEffect } from 'react'

import type { StepNavItem } from '../../../elements/StepNav/index.js'

import { useStepNav } from '../../../elements/StepNav/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useEntityVisibility } from '../../../providers/EntityVisibility/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const SetDocumentStepNav: React.FC<{
  collectionSlug?: SanitizedCollectionConfig['slug']
  globalLabel?: SanitizedGlobalConfig['label']
  globalSlug?: SanitizedGlobalConfig['slug']
  id?: number | string
  isTrashed?: boolean
  pluralLabel?: SanitizedCollectionConfig['labels']['plural']
  useAsTitle?: SanitizedCollectionConfig['admin']['useAsTitle']
  view?: string
}> = (props) => {
  const { id, collectionSlug, globalSlug, isTrashed, pluralLabel, useAsTitle } = props

  const view: string | undefined = props?.view || undefined

  const { isEditing, isInitializing } = useDocumentInfo()
  const { title } = useDocumentTitle()

  const { isEntityVisible } = useEntityVisibility()
  const isVisible = isEntityVisible({ collectionSlug, globalSlug })

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
      serverURL,
    },
  } = useConfig()

  useEffect(() => {
    const nav: StepNavItem[] = []

    if (!isInitializing) {
      if (collectionSlug) {
        // Collection label
        nav.push({
          label: getTranslation(pluralLabel, i18n),
          url: isVisible
            ? formatAdminURL({
                adminRoute,
                path: `/collections/${collectionSlug}`,
              })
            : undefined,
        })

        // Trash breadcrumb (if in trash view)
        if (isTrashed) {
          nav.push({
            label: t('general:trash'),
            url: isVisible
              ? formatAdminURL({
                  adminRoute,
                  path: `/collections/${collectionSlug}/trash`,
                })
              : undefined,
          })
        }

        // Document label
        if (isEditing) {
          nav.push({
            label: (useAsTitle && useAsTitle !== 'id' && title) || `${id}`,
            url: isVisible
              ? formatAdminURL({
                  adminRoute,
                  path: isTrashed
                    ? `/collections/${collectionSlug}/trash/${id}`
                    : `/collections/${collectionSlug}/${id}`,
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

      // Fallback view (used for versions, previews, etc.)
      if (view) {
        nav.push({
          label: view,
        })
      }

      setStepNav(nav)
    }
  }, [
    setStepNav,
    isInitializing,
    isEditing,
    pluralLabel,
    id,
    isTrashed,
    useAsTitle,
    adminRoute,
    t,
    i18n,
    title,
    collectionSlug,
    globalSlug,
    serverURL,
    view,
    isVisible,
  ])

  return null
}
