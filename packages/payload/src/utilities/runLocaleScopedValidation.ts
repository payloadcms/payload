import type { ValidationFieldError } from '../errors/index.js'
import type { Field } from '../fields/config/types.js'
import type { Payload, RequestContext, User } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'
import type { ValidationResult } from '../types/validation.js'

import {
  cloneValidationContext,
  cloneValidationData,
  cloneValidationRequest,
  cloneValidationUser,
} from './cloneValidationRequest.js'
import { createPayloadRequest } from './createPayloadRequest.js'
import { isValidationErrorPathLocalized } from './isValidationErrorPathLocalized.js'
import {
  resolveValidationConcurrency,
  resolveValidationLocales,
  runValidationLocalePasses,
  type ValidationLocaleSelector,
} from './resolveValidationLocales.js'

type ClassifiedValidationError = {
  error: ValidationFieldError
  isLocalized: boolean
  validationLocale: null | string
}

/**
 * Clones the caller's request into one scoped to `validate`, resolves the selected locales, runs
 * `runPass` once per locale against an independent request/data clone, and aggregates the field
 * errors. Shared by the collection and global local validate wrappers so the locale-cloning and
 * pass-running plumbing has one owner instead of two copies that can drift apart.
 */
export async function runLocaleScopedValidation<TData>({
  context,
  data,
  fields,
  locale,
  payload,
  req,
  runPass,
  user,
}: {
  context: RequestContext | undefined
  data: TData
  fields: Field[]
  locale: undefined | ValidationLocaleSelector
  payload: Payload
  req: Partial<PayloadRequest> | undefined
  runPass: (args: {
    data: TData
    onValidationData: (data: JsonObject) => void
    req: PayloadRequest
  }) => Promise<ValidationResult>
  user: null | undefined | User
}): Promise<ValidationResult> {
  const baseReq = await createPayloadRequest({
    context: cloneValidationContext({ context }),
    fallbackLocale: false,
    payload,
    req: cloneValidationRequest({ request: req }),
    user: cloneValidationUser({ user }),
  })
  baseReq.operation = 'validate'
  const localeSelector = locale === undefined ? (baseReq.locale ?? null) : locale
  const locales = await resolveValidationLocales({
    locale: localeSelector,
    req: baseReq,
  })
  const results = await runValidationLocalePasses({
    concurrency: resolveValidationConcurrency(req),
    locales,
    validate: async (validationLocale) => {
      const localeReq = await createPayloadRequest({
        fallbackLocale: false,
        locale: validationLocale ?? undefined,
        payload,
        req: cloneValidationRequest({ request: baseReq }),
      })
      const validationData = cloneValidationData({ data })

      let mergedValidationData = validationData as JsonObject
      const result = await runPass({
        data: validationData,
        onValidationData: (mergedData) => {
          mergedValidationData = mergedData
        },
        req: localeReq,
      })

      return result.errors.map((error) => ({
        error,
        isLocalized: isValidationErrorPathLocalized({
          configBlockReferences: payload.config.blocks,
          data: mergedValidationData,
          fields,
          path: error.path,
        }),
        validationLocale,
      }))
    },
  })
  const classifiedErrors = results.flat()
  const rawErrors = classifiedErrors.map(({ error }) => error)

  // A non-localized field carries one shared value, so every locale pass validates it
  // identically and would otherwise report the same failure once per resolved locale.
  const errors =
    locales.length > 1
      ? dedupeNonLocalizedFieldErrors({
          errors: classifiedErrors,
          localeCount: locales.length,
        })
      : rawErrors

  return {
    errors,
    valid: errors.length === 0,
  }
}

function dedupeNonLocalizedFieldErrors({
  errors,
  localeCount,
}: {
  errors: ClassifiedValidationError[]
  localeCount: number
}): ValidationFieldError[] {
  const localesByErrorIdentity = new Map<string, Set<null | string>>()
  const seenNonLocalizedErrors = new Set<string>()
  const deduped: ValidationFieldError[] = []

  for (const { error, isLocalized, validationLocale } of errors) {
    if (!isLocalized) {
      const errorIdentity = JSON.stringify([error.path, error.message])
      const validationLocales = localesByErrorIdentity.get(errorIdentity) ?? new Set()

      validationLocales.add(validationLocale)
      localesByErrorIdentity.set(errorIdentity, validationLocales)
    }
  }

  for (const { error, isLocalized } of errors) {
    if (isLocalized) {
      deduped.push(error)
      continue
    }

    const errorIdentity = JSON.stringify([error.path, error.message])
    const hasFailedForEveryLocale = localesByErrorIdentity.get(errorIdentity)?.size === localeCount

    if (!hasFailedForEveryLocale) {
      deduped.push(error)
      continue
    }

    if (seenNonLocalizedErrors.has(errorIdentity)) {
      continue
    }

    seenNonLocalizedErrors.add(errorIdentity)
    deduped.push({ ...error, locale: undefined })
  }

  return deduped
}
