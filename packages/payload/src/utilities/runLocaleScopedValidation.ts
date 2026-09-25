import type { ValidationResult } from '../collections/operations/local/validate.js'
import type { ValidationFieldError } from '../errors/index.js'
import type { Field } from '../fields/config/types.js'
import type { Payload, RequestContext, SanitizedConfig, User } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { createPayloadRequest } from './createPayloadRequest.js'
import { isValidationErrorPathLocalized } from './isValidationErrorPathLocalized.js'
import { projectNonLocalizedData } from './projectNonLocalizedData.js'
import {
  cloneValidationRequest,
  cloneValidationValue,
  resolveValidationConcurrency,
  resolveValidationLocales,
  runValidationLocalePasses,
  type ValidationLocaleSelector,
} from './resolveValidationLocales.js'

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
  validationDataLocale,
}: {
  context: RequestContext | undefined
  data: TData
  fields: Field[]
  locale: ValidationLocaleSelector
  payload: Payload
  req: Partial<PayloadRequest> | undefined
  runPass: (args: {
    data: TData
    onValidationData: (data: JsonObject) => void
    req: PayloadRequest
  }) => Promise<ValidationResult>
  user: null | undefined | User
  validationDataLocale: string | undefined
}): Promise<ValidationResult> {
  const baseReq = await createPayloadRequest({
    context: cloneValidationValue(context),
    fallbackLocale: false,
    payload,
    req: cloneValidationRequest(req),
    user: cloneValidationValue(user),
  })
  baseReq.operation = 'validate'
  const locales = await resolveValidationLocales({
    locale,
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
        req: cloneValidationRequest(baseReq),
      })
      const validationCandidateData = cloneValidationValue(data)
      const validationData: TData =
        validationDataLocale && validationLocale !== validationDataLocale && validationCandidateData
          ? (projectNonLocalizedData({
              configBlockReferences: payload.config.blocks,
              data: validationCandidateData as JsonObject,
              fields,
            }) as TData)
          : validationCandidateData

      let mergedValidationData = validationData as JsonObject
      const result = await runPass({
        data: validationData,
        onValidationData: (mergedData) => {
          mergedValidationData = mergedData
        },
        req: localeReq,
      })

      return { data: mergedValidationData, result }
    },
  })
  const rawErrors = results.flatMap(({ result }) => result.errors)

  // A non-localized field carries one shared value, so every locale pass validates it
  // identically and would otherwise report the same failure once per resolved locale.
  const errors =
    locales.length > 1
      ? dedupeNonLocalizedFieldErrors({
          configBlockReferences: payload.config.blocks,
          errors: results.flatMap(({ data: validationData, result }) =>
            result.errors.map((error) => ({ data: validationData, error })),
          ),
          fields,
        })
      : rawErrors

  return {
    errors,
    valid: errors.length === 0,
  }
}

function dedupeNonLocalizedFieldErrors({
  configBlockReferences,
  errors,
  fields,
}: {
  configBlockReferences: SanitizedConfig['blocks']
  errors: { data: JsonObject; error: ValidationFieldError }[]
  fields: Field[]
}): ValidationFieldError[] {
  const seenNonLocalizedErrors = new Set<string>()
  const deduped: ValidationFieldError[] = []

  for (const { data, error } of errors) {
    const isLocalized = isValidationErrorPathLocalized({
      configBlockReferences,
      data,
      fields,
      path: error.path,
    })

    if (isLocalized) {
      deduped.push(error)
      continue
    }

    const errorIdentity = JSON.stringify([error.path, error.message])

    if (seenNonLocalizedErrors.has(errorIdentity)) {
      continue
    }

    seenNonLocalizedErrors.add(errorIdentity)
    deduped.push({ ...error, locale: undefined })
  }

  return deduped
}
