'use client'
import { getTranslation } from '@payloadcms/translations'
import { useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { Fragment } from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useLocale, useLocaleLoading } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { Popup, PopupList } from '../Popup/index.js'
import { LocalizerLabel } from './LocalizerLabel/index.js'
import './index.scss'

const baseClass = 'localizer'

export const Localizer: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  const {
    config: { localization },
  } = useConfig()
  const searchParams = useSearchParams()
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
                    href={qs.stringify(
                      {
                        ...parseSearchParams(searchParams),
                        locale: localeOption.code,
                      },
                      { addQueryPrefix: true },
                    )}
                    key={localeOption.code}
                    onClick={() => {
                      setLocaleIsLoading(true)
                      close()
                    }}
                  >
                    {localeOptionLabel !== localeOption.code ? (
                      <Fragment>
                        {localeOptionLabel}
                        &nbsp;
                        <span className={`${baseClass}__locale-code`}>
                          {`(${localeOption.code})`}
                        </span>
                      </Fragment>
                    ) : (
                      <span className={`${baseClass}__locale-code`}>{localeOptionLabel}</span>
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
