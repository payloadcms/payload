'use client'
import { getTranslation } from '@payloadcms/translations'
import * as qs from 'qs-esm'
import React, { Fragment, useState } from 'react'

import type { PopupButtonRenderProps } from '../Popup/PopupTrigger/index.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { LanguageIcon } from '../../icons/Language/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale, useLocaleLoading } from '../../providers/Locale/index.js'
import { useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
  renderButton?: (props: { 'aria-label': string } & PopupButtonRenderProps) => React.ReactNode
}> = (props) => {
  const { className, renderButton } = props
  const {
    config: { localization },
  } = useConfig()

  const searchParams = useSearchParams()

  // `useSearchParams` can be stale because `ListQueryProvider` updates the URL with
  // `window.history.pushState`, so the query is read from `window.location` when the menu opens
  const [searchWhenOpened, setSearchWhenOpened] = useState<null | string>(null)

  const { setLocaleIsLoading } = useLocaleLoading()

  const { i18n, t } = useTranslation()
  const locale = useLocale()

  if (localization && locale) {
    const { locales } = localization
    const localeLabel = getTranslation(locale.label, i18n)
    const localeAccessibleName =
      localeLabel === locale.code
        ? `${t('general:locale')}: ${locale.code}`
        : `${t('general:locale')}: ${localeLabel} (${locale.code})`

    return (
      <div className={[baseClass, className].filter(Boolean).join(' ')}>
        <Popup
          horizontalAlign="right"
          onToggleClose={() => setSearchWhenOpened(null)}
          onToggleOpen={() => setSearchWhenOpened(window.location.search)}
          popupType="menu"
          render={({ close }) => (
            <PopupList.RadioGroup>
              {locales.map((localeOption) => {
                const localeOptionLabel = getTranslation(localeOption.label, i18n)
                const isActive = locale.code === localeOption.code

                // Rendered as links so `LeaveWithoutSaving` can intercept the navigation
                // when the document has unsaved changes
                const localeURL = isActive
                  ? undefined
                  : qs.stringify(
                      {
                        ...qs.parse(searchWhenOpened ?? searchParams.toString(), {
                          depth: 10,
                          ignoreQueryPrefix: true,
                        }),
                        locale: localeOption.code,
                      },
                      { addQueryPrefix: true },
                    )

                return (
                  <PopupList.RadioGroupItem
                    active={isActive}
                    href={localeURL}
                    key={localeOption.code}
                    onClick={() => {
                      if (!isActive) {
                        setLocaleIsLoading(true)
                      }

                      close()
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
          renderButton={(buttonProps) => {
            const labeledButtonProps = {
              ...buttonProps,
              'aria-label': localeAccessibleName,
            }

            if (renderButton) {
              return renderButton(labeledButtonProps)
            }

            const { active: _active, onClick, onKeyDown, ...ariaProps } = labeledButtonProps

            return (
              <Button
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
            )
          }}
          showScrollbar
        />
      </div>
    )
  }

  return null
}
