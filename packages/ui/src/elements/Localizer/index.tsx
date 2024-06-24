'use client'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useSearchParams } from '../../providers/SearchParams/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { LocalizerLabel } from './LocalizerLabel/index.js'
import './index.scss'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const config = useConfig()
  const { localization } = config

  const { i18n } = useTranslation()
  const locale = useLocale()
  const { stringifyParams } = useSearchParams()
  const router = useRouter()
  const { clearRouteCache } = useRouteCache()

  if (localization) {
    const { locales } = localization

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Popup
          button={<LocalizerLabel />}
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              {locales.map((localeOption) => {
                const localeOptionLabel = getTranslation(localeOption.label, i18n)

                return (
                  <PopupList.Button
                    active={locale.code === localeOption.code}
                    key={localeOption.code}
                    onClick={() => {
                      router.replace(
                        stringifyParams({
                          params: {
                            locale: localeOption.code,
                          },
                        }),
                      )
                      clearRouteCache()
                      close()
                    }}
                  >
                    {localeOptionLabel}
                    {localeOptionLabel !== localeOption.code && ` (${localeOption.code})`}
                  </PopupList.Button>
                )
              })}
            </PopupList.ButtonGroup>
          )}
          showScrollbar
          size="large"
        />
      </div>
    )
  }

  return null
}
