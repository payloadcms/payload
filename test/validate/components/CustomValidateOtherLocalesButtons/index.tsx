'use client'
import type { ValidationResult } from 'payload'

import { Button, useConfig, useDocumentInfo, useForm, useLocale } from '@payloadcms/ui'
import React, { useState } from 'react'

import {
  getValidateEndpoint,
  requestValidation,
  stripLocalizedFields,
} from '../validationRequests.js'

const baseClass = 'custom-validate-other-locales-buttons'

export function CustomValidateOtherLocalesButtons() {
  const { id, collectionSlug, docConfig, globalSlug } = useDocumentInfo()
  const {
    config: {
      localization,
      routes: { api },
    },
  } = useConfig()
  const { code: activeLocaleCode } = useLocale()
  const { getData } = useForm()

  const [results, setResults] = useState<Record<string, ValidationResult>>({})
  const [validatingLocale, setValidatingLocale] = useState<null | string>(null)

  const otherLocales = localization
    ? localization.locales.filter(({ code }) => code !== activeLocaleCode)
    : []

  const handleClick = async (localeCode: string) => {
    setValidatingLocale(localeCode)

    const endpoint = getValidateEndpoint({ id, apiRoute: api, collectionSlug, globalSlug })
    const fields = docConfig?.fields ?? []

    const validationResult = await requestValidation({
      body: stripLocalizedFields({ data: getData(), fields }),
      endpoint,
      locales: [localeCode],
    })

    setResults((previousResults) => ({ ...previousResults, [localeCode]: validationResult }))
    setValidatingLocale(null)
  }

  if (!otherLocales.length) {
    return null
  }

  return (
    <div className={baseClass} id="custom-validate-other-locales">
      {otherLocales.map(({ code, required }) => {
        const isValidating = validatingLocale === code
        const result = results[code]

        return (
          <div className={`${baseClass}__locale`} key={code}>
            <Button
              buttonStyle="secondary"
              disabled={isValidating}
              id={`custom-validate-locale-${code}`}
              loading={isValidating}
              onClick={() => void handleClick(code)}
              size="medium"
            >
              {`Custom validate ${code}${required ? ' (required)' : ''}`}
            </Button>
            {result && (
              <div className={`${baseClass}__result`} id={`custom-validate-locale-${code}-result`}>
                {result.valid
                  ? `${code} valid`
                  : result.errors.map((error, index) => (
                      <p key={`${error.path}:${index}`}>{`${error.path}: ${error.message}`}</p>
                    ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
