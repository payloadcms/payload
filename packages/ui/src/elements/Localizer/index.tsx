'use client'
import { getTranslation } from '@payloadcms/translations'
import * as qs from 'qs-esm'
import React, { Fragment } from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { LanguageIcon } from '../../icons/Language/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale, useLocaleLoading } from '../../providers/Locale/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
  renderButton?: (props: {
    active: boolean
    'aria-expanded': boolean
    'aria-haspopup': true
    onClick: React.MouseEventHandler
    onKeyDown: React.KeyboardEventHandler
  }) => React.ReactNode
}> = (props) => {
  const { className, renderButton } = props
  const {
    config: { localization },
  } = useConfig()

  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const { setLocaleIsLoading } = useLocaleLoading()

  const { i18n, t } = useTranslation()
  const locale = useLocale()

  if (localization) {
    const { locales } = localization

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Popup
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.RadioGroup>
              {locales.map((localeOption) => {
                const localeOptionLabel = getTranslation(localeOption.label, i18n)

                return (
                  <PopupList.RadioGroupItem
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
                  </PopupList.RadioGroupItem>
                )
              })}
            </PopupList.RadioGroup>
          )}
          renderButton={
            renderButton ??
            (({ active: _active, onClick, onKeyDown, ...ariaProps }) => (
              <Button
                aria-label={t('general:locale')}
                buttonStyle="secondary"
                extraButtonProps={{ onKeyDown }}
                icon={<LanguageIcon size={24} />}
                iconPosition="left"
                onClick={onClick}
                {...ariaProps}
              >
                <div className={`${baseClass}__button-content`}>
                  {locale.code}
                  <ChevronIcon size={16} />
                </div>
              </Button>
            ))
          }
          showScrollbar
        />
      </div>
    )
  }

  return null
}
