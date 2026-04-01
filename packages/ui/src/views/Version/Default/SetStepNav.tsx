'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import { useEffect } from 'react'

import { useStepNav } from '../../../elements/StepNav/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const SetStepNav: React.FC<{
  readonly collectionConfig?: ClientCollectionConfig
  readonly globalConfig?: ClientGlobalConfig
  readonly id?: number | string
  readonly isTrashed?: boolean
  versionToCreatedAtFormatted?: string
  versionToID?: string
}> = ({
  id,
  collectionConfig,
  globalConfig,
  isTrashed,
  versionToCreatedAtFormatted,
  versionToID,
}) => {
  const { config } = useConfig()
  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation()
  const locale = useLocale()
  const { title } = useDocumentTitle()

  useEffect(() => {
    const {
      routes: { admin: adminRoute },
      serverURL,
    } = config

    if (collectionConfig) {
      const collectionSlug = collectionConfig.slug

      const pluralLabel = collectionConfig.labels?.plural

      const docBasePath: `/${string}` = isTrashed
        ? `/collections/${collectionSlug}/trash/${id}`
        : `/collections/${collectionSlug}/${id}`

      const nav = [
        {
          label: getTranslation(pluralLabel, i18n),
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}`,
          }),
        },
      ]

      if (isTrashed) {
        nav.push({
          label: t('general:trash'),
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/trash`,
          }),
        })
      }

      nav.push(
        {
          label: title,
          url: formatAdminURL({
            adminRoute,
            path: docBasePath,
          }),
        },
        {
          label: t('version:versions'),
          url: formatAdminURL({
            adminRoute,
            path: `${docBasePath}/versions`,
          }),
        },
        {
          label: versionToCreatedAtFormatted,
          url: undefined,
        },
      )

      setStepNav(nav)
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
          label: t('version:versions'),
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
    isTrashed,
    locale,
    t,
    i18n,
    collectionConfig,
    globalConfig,
    title,
    versionToCreatedAtFormatted,
    versionToID,
  ])

  return null
}
