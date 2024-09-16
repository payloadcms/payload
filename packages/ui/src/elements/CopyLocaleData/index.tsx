'use client'

import type { MappedComponent } from 'payload'

import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'copy-locale-data'

export const DefaultComponent: React.FC = () => {
  const {
    config: {
      localization,
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const { code: currentLocale } = useLocale()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { i18n, t } = useTranslation()
  const { submit } = useForm()
  const modified = useFormModified()

  const copyLocaleData = useCallback(
    async ({ from, to }) => {
      if (modified) {
        toast.error(t('general:unsavedChanges'))
        return null
      }

      let url
      let method = 'PATCH'

      try {
        if (collectionSlug) {
          url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${from}`
        } else if (globalSlug) {
          url = `${serverURL}${api}/globals/${globalSlug}?locale=${from}`
          method = 'POST'
        }

        const response = await fetch(url)
        const data = await response.json()
        const action = url.replace(from, to)

        await submit({
          action,
          method,
          overrides: {
            ...data,
            _status: 'draft',
          },
          skipValidation: true,
        })
      } catch (error) {
        toast.error(error.message)
      }
    },
    [modified, collectionSlug, globalSlug, t, submit, serverURL, api, id],
  )

  if (!localization) {
    return null
  }

  const formattedCurrentLocale = localization?.locales.map((locale) => {
    const isMatchingLocale =
      typeof locale === 'string' ? locale === currentLocale : locale.code === currentLocale

    if (isMatchingLocale) {
      return typeof locale.label === 'string' ? locale.label : locale.label?.[i18n?.language]
    }
  })

  return (
    <Popup
      button={<Button buttonStyle="secondary">{t('general:copy')}</Button>}
      buttonType="custom"
      className={baseClass}
    >
      <PopupList.ButtonGroup>
        {localization.locales.map((locale) => {
          const formattedLabel =
            typeof locale.label === 'string'
              ? locale.label
              : locale.label && locale.label[i18n?.language]

          const isActive =
            typeof locale === 'string' ? locale === currentLocale : locale.code === currentLocale

          if (isActive) {
            return null
          }

          return (
            <PopupList.Button
              key={locale.code}
              onClick={async () => {
                await copyLocaleData({
                  from: currentLocale,
                  to: typeof locale === 'string' ? locale : locale.code,
                })
              }}
            >
              {formattedCurrentLocale} to {formattedLabel}
            </PopupList.Button>
          )
        })}
      </PopupList.ButtonGroup>
    </Popup>
  )
}

type Props = {
  CustomComponent?: MappedComponent
}

export const CopyLocaleData: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) {
    return <RenderComponent mappedComponent={CustomComponent} />
  }
  return <DefaultComponent />
}
