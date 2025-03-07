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
                    disabled={locale.code === localeOption.code}
                    key={localeOption.code}
                    onClick={() => {
                      setLocaleIsLoading(true)
                      close()

                      // can't use `useSearchParams` here because it is stale due to `window.history.pushState` in `ListQueryProvider`
                      const searchParams = new URLSearchParams(window.location.search)

                      const url = qs.stringify(
                        {
                          ...qs.parse(searchParams.toString(), {
                            depth: 10,
                            ignoreQueryPrefix: true,
                          }),
                          locale: localeOption.code,
                        },
                        { addQueryPrefix: true },
                      )

                      startRouteTransition(() => {
                        router.push(url)
                      })
                    }}
                  >
                    {localeOptionLabel !== localeOption.code ? (
                      <Fragment>
                        {localeOptionLabel}
                        &nbsp;
                        <span
                          className={`${baseClass}__locale-code`}
                          data-locale={localeOption.code}
                        >
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

  return null
}
