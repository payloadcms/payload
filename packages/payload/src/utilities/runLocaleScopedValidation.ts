import type { ValidationResult } from '../collections/operations/local/validate.js'
import type { Field } from '../fields/config/types.js'
import type { Payload, RequestContext, User } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { createLocalReq } from './createLocalReq.js'
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
  runPass: (args: { data: TData; req: PayloadRequest }) => Promise<ValidationResult>
  user: null | undefined | User
  validationDataLocale: string | undefined
}): Promise<ValidationResult> {
  const baseReq = await createLocalReq(
    {
      context: cloneValidationValue(context),
      fallbackLocale: false,
      req: cloneValidationRequest(req),
      user: cloneValidationValue(user),
    },
    payload,
  )
  baseReq.operation = 'validate'
  const locales = await resolveValidationLocales({
    locale,
    req: baseReq,
  })
  const results = await runValidationLocalePasses({
    concurrency: resolveValidationConcurrency(req),
    locales,
    validate: async (validationLocale) => {
      const localeReq = await createLocalReq(
        {
          fallbackLocale: false,
          locale: validationLocale ?? undefined,
          req: cloneValidationRequest(baseReq),
        },
        payload,
      )
      const validationCandidateData = cloneValidationValue(data)
      const validationData: TData =
        validationDataLocale && validationLocale !== validationDataLocale && validationCandidateData
          ? (projectNonLocalizedData({
              configBlockReferences: payload.config.blocks,
              data: validationCandidateData as JsonObject,
              fields,
            }) as TData)
          : validationCandidateData

      return runPass({ data: validationData, req: localeReq })
    },
  })
  const errors = results.flatMap((result) => result.errors)

  return {
    errors,
    valid: errors.length === 0,
  }
}
