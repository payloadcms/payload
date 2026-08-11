'use client'
import type { ValidationResult } from 'payload'

import { Button, useConfig, useDocumentInfo, useForm, useLocale } from '@payloadcms/ui'
import React, { useState } from 'react'

import {
  getValidateEndpoint,
  requestValidation,
  stripLocalizedFields,
} from '../validationRequests.js'

const baseClass = 'custom-validate-all-locales-button'

export function CustomValidateAllLocalesButton() {
  const { id, collectionSlug, docConfig, globalSlug } = useDocumentInfo()
  const {
    config: {
      localization,
      routes: { api },
    },
  } = useConfig()
  const { code: activeLocaleCode } = useLocale()
  const { getData } = useForm()

  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<null | ValidationResult>(null)

  const handleClick = async () => {
    setIsValidating(true)

    const endpoint = getValidateEndpoint({ id, apiRoute: api, collectionSlug, globalSlug })
    const data = getData()
    const fields = docConfig?.fields ?? []
    const siblingLocaleCodes = (localization ? localization.locales : [])
      .map(({ code }) => code)
      .filter((code) => code !== activeLocaleCode)

    const results = [await requestValidation({ body: data, endpoint, locales: [activeLocaleCode] })]

    if (siblingLocaleCodes.length > 0) {
      results.push(
        await requestValidation({
          body: stripLocalizedFields({ data, fields }),
          endpoint,
          locales: siblingLocaleCodes,
        }),
      )
    }

    setResult({
      errors: results.flatMap(({ errors }) => errors),
      valid: results.every(({ valid }) => valid),
    })
    setIsValidating(false)
  }

  return (
    <div className={baseClass} id="custom-validate-all-locales">
      <Button
        buttonStyle="secondary"
        disabled={isValidating}
        id="custom-validate-all-locales-button"
        loading={isValidating}
        onClick={() => void handleClick()}
        size="medium"
      >
        Custom validate all locales
      </Button>
      {result && (
        <div className={`${baseClass}__result`} id="custom-validate-all-locales-result">
          {result.valid
            ? 'All locales valid'
            : result.errors.map((error, index) => (
                <p key={`${error.locale ?? ''}:${error.path}:${index}`}>
                  {`${error.locale ?? ''} ${error.path}: ${error.message}`}
                </p>
              ))}
        </div>
      )}
    </div>
  )
}
