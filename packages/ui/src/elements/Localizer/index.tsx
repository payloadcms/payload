'use client'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { Fragment } from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale, useLocaleLoading } from '../../providers/Locale/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'
import { LocalizerLabel } from './LocalizerLabel/index.js'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const {
    config: { localization },
  } = useConfig()

  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const { setLocaleIsLoading } = useLocaleLoading()

  const { i18n } = useTranslation()
  const locale = useLocale()

  const updateLocaleInURL = React.useCallback(
    (newLocaleCode: string) => {
      const searchParams = new URLSearchParams(window.location.search)

      const url = qs.stringify(
        {
          ...qs.parse(searchParams.toString(), {
            depth: 10,
            ignoreQueryPrefix: true,
          }),
          locale: newLocaleCode,
        },
        { addQueryPrefix: true },
      )

      startRouteTransition(() => {
        router.push(url)
      })
    },
    [router, startRouteTransition],
  )

  // React.useEffect(() => {
  //   const searchParams = new URLSearchParams(window.location.search)
  //   const hasLocale = searchParams.has('locale')

  //   if (!hasLocale) {
  //     updateLocaleInURL(locale.code)
  //   }
  // }, [locale.code, updateLocaleInURL])

  if (!localization) {
    return null
  }

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
              const isActive = locale.code === localeOption.code

              return (
                <PopupList.Button
                  active={isActive}
                  disabled={isActive}
                  key={localeOption.code}
                  onClick={() => {
                    setLocaleIsLoading(true)
                    close()
                    updateLocaleInURL(localeOption.code)
                  }}
                >
                  {localeOptionLabel !== localeOption.code ? (
                    <Fragment>
                      {localeOptionLabel}
                      &nbsp;
                      <span className={`${baseClass}__locale-code`} data-locale={localeOption.code}>
                        {`(${localeOption.code})`}
                      </span>
                    </Fragment>
                  ) : (
                    <span className={`${baseClass}__locale-code`} data-locale={localeOption.code}>
                      {localeOptionLabel}
                    </span>
                  )}
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
