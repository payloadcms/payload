'use client'

import type { Locale } from 'payload'

import React, { useEffect, useMemo } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useConfig } from '../Config/index.js'
import { LocaleContext, useLocale, useLocaleLoading } from '../Locale/index.js'

/** Keeps the locale with the server-rendered page data, including cached history entries. */
export const PageLocaleProvider: React.FC<{
  children?: React.ReactNode
  locale?: Locale['code']
}> = ({ children, locale: renderedLocaleCode }) => {
  const {
    config: { localization },
  } = useConfig()
  const contextLocale = useLocale()
  const { setLocaleIsLoading } = useLocaleLoading()
  const renderedLocale = useMemo(
    () =>
      localization && renderedLocaleCode
        ? findLocaleFromCode(localization, renderedLocaleCode)
        : null,
    [localization, renderedLocaleCode],
  )

  useEffect(() => {
    setLocaleIsLoading(false)
  }, [renderedLocaleCode, setLocaleIsLoading])

  return <LocaleContext value={renderedLocale ?? contextLocale}>{children}</LocaleContext>
}
