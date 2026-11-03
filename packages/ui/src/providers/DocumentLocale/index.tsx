'use client'

import type { Locale } from 'payload'

import React, { use, useEffect, useMemo } from 'react'

import { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
import { useConfig } from '../Config/index.js'
import { DocumentLocaleClaimContext, LocaleContext, useLocale } from '../Locale/index.js'

/**
 * Scopes the locale to the one a document was rendered in on the server.
 *
 * The client locale and the rendered document data can otherwise disagree, e.g. when browser back
 * navigation restores a cached render of a URL without the `locale` param while the user's
 * locale preference has since changed. Saving in that state would write one locale's data into another.
 * Everything inside this provider (form state, autosave, save action) uses the rendered locale,
 * and the global locale is synced to it so the locale selector reflects the data being edited.
 */
export const DocumentLocaleProvider: React.FC<{
  children?: React.ReactNode
  /** The locale code the document data was rendered in. */
  locale?: Locale['code']
}> = ({ children, locale: renderedLocaleCode }) => {
  const {
    config: { localization },
  } = useConfig()

  const contextLocale = useLocale()
  const { claimDocumentLocale } = use(DocumentLocaleClaimContext)

  const renderedLocale = useMemo(
    () =>
      localization && renderedLocaleCode
        ? findLocaleFromCode(localization, renderedLocaleCode)
        : null,
    [localization, renderedLocaleCode],
  )

  useEffect(() => {
    if (!renderedLocale?.code) {
      return
    }

    return claimDocumentLocale({ code: renderedLocale.code })
  }, [claimDocumentLocale, renderedLocale?.code])

  return <LocaleContext value={renderedLocale ?? contextLocale}>{children}</LocaleContext>
}
