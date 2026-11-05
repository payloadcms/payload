'use client'

import type { Locale, ServerFunctionClient } from 'payload'

import React, { useCallback, useEffect, useMemo } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useConfig } from '../Config/index.js'
import { LocaleContext, useLocale, useLocaleLoading } from '../Locale/index.js'
import { ServerFunctionsProvider, useServerFunctions } from '../ServerFunctions/index.js'

/** Keeps the locale with the server-rendered page data, including cached history entries. */
export const PageLocaleProvider: React.FC<{
  children?: React.ReactNode
  locale?: Locale['code']
}> = ({ children, locale: renderedLocaleCode }) => {
  const {
    config: { localization },
  } = useConfig()
  const contextLocale = useLocale()
  const { serverFunction } = useServerFunctions()
  const { setLocaleIsLoading } = useLocaleLoading()
  const renderedLocale = useMemo(
    () =>
      localization && renderedLocaleCode
        ? findLocaleFromCode(localization, renderedLocaleCode)
        : null,
    [localization, renderedLocaleCode],
  )

  const locale = renderedLocale ?? contextLocale
  const scopedServerFunction = useCallback<ServerFunctionClient>(
    (args) => serverFunction({ ...args, locale: args.locale ?? locale?.code }),
    [locale?.code, serverFunction],
  )

  useEffect(() => {
    setLocaleIsLoading(false)
  }, [renderedLocaleCode, setLocaleIsLoading])

  return (
    <LocaleContext value={locale}>
      <ServerFunctionsProvider serverFunction={scopedServerFunction}>
        {children}
      </ServerFunctionsProvider>
    </LocaleContext>
  )
}
