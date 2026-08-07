'use client'

import type { SanitizedLocale, ValidationFieldError, ValidationResult } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useMemo } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { Drawer } from '../Drawer/index.js'
import { Gutter } from '../Gutter/index.js'
import './index.css'

const baseClass = 'validation-results'

export const ValidationResultsDrawer: React.FC<{
  activeLocale: string
  locales: SanitizedLocale[]
  result: null | ValidationResult
  slug: string
}> = ({ slug, activeLocale, locales, result }) => {
  const { i18n, t } = useTranslation()
  const errorsByLocale = useMemo(() => {
    return (result?.errors ?? []).reduce<Record<string, ValidationFieldError[]>>(
      (groups, error) => {
        const locale = error.locale ?? activeLocale
        groups[locale] = [...(groups[locale] ?? []), error]
        return groups
      },
      {},
    )
  }, [activeLocale, result?.errors])

  if (!result) {
    return null
  }

  return (
    <Drawer className={baseClass} slug={slug} title={t('validation:validationResults')}>
      <Gutter className={`${baseClass}__content`}>
        {result.valid ? (
          <p aria-live="polite" className={`${baseClass}__valid`} role="status">
            {t('validation:documentValid')}
          </p>
        ) : (
          <div aria-live="assertive" role="alert">
            <p>{t('validation:documentInvalid')}</p>
            {Object.entries(errorsByLocale).map(([localeCode, errors]) => {
              const locale = locales.find(({ code }) => code === localeCode)
              const localeLabel = locale ? getTranslation(locale.label, i18n) : localeCode

              return (
                <section className={`${baseClass}__locale`} key={localeCode}>
                  <h3>
                    {localeLabel}
                    {locale?.required && (
                      <span className={`${baseClass}__required`}>
                        {t('validation:requiredLocale')}
                      </span>
                    )}
                  </h3>
                  <ul>
                    {errors.map((error, index) => (
                      <li key={`${error.path}:${error.message}:${index}`}>
                        {error.path && <code>{error.path}</code>}
                        <span>{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </Gutter>
    </Drawer>
  )
}
