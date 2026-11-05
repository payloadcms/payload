'use client'

import type { Locale, ServerFunctionClient } from 'payload'

import React, { createContext, use, useCallback, useEffect, useMemo } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useAuth } from '../Auth/index.js'
import { useConfig } from '../Config/index.js'
import { LocaleContext, useLocale, useLocaleLoading } from '../Locale/index.js'
import { usePreferences } from '../Preferences/index.js'
import { ServerFunctionsProvider, useServerFunctions } from '../ServerFunctions/index.js'

// Only the outermost rendered-locale scope owns the shared page loading state.
const PageLocaleScopeContext = createContext(false)

/** Keeps the locale with the server-rendered page data, including cached history entries. */
export const PageLocaleProvider: React.FC<{
  children?: React.ReactNode
  locale?: Locale['code']
}> = ({ children, locale: renderedLocaleCode }) => {
  const {
    config: { localization },
  } = useConfig()
  const { user } = useAuth()
  const { setPreference } = usePreferences()
  const hasParentScope = use(PageLocaleScopeContext)
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
    if (!hasParentScope) {
      setLocaleIsLoading(false)
    }
  }, [hasParentScope, renderedLocaleCode, setLocaleIsLoading])

  useEffect(() => {
    if (
      !hasParentScope &&
      user?.id &&
      renderedLocale?.code &&
      renderedLocale.code !== contextLocale?.code
    ) {
      // Back can restore a cached page while the root still holds the newer locale.
      // Keep future navigation without a locale parameter aligned with the restored page.
      void setPreference<Locale['code']>('locale', renderedLocale.code)
    }
  }, [contextLocale?.code, hasParentScope, renderedLocale?.code, setPreference, user?.id])

  return (
    <PageLocaleScopeContext value={true}>
      <LocaleContext value={locale}>
        <ServerFunctionsProvider serverFunction={scopedServerFunction}>
          {children}
        </ServerFunctionsProvider>
      </LocaleContext>
    </PageLocaleScopeContext>
  )
}
