import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { ValidationResult } from '../../../collections/operations/local/validate.js'
import type { GlobalSlug, JsonObject, Payload, RequestContext, User } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { ValidationLocaleSelector } from '../../../utilities/resolveValidationLocales.js'
import type { DataFromGlobalSlug, DraftFlagFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { filterDataToSelectedLocales } from '../../../utilities/filterDataToSelectedLocales.js'
import {
  cloneValidationRequest,
  resolveValidationLocales,
  runValidationLocalePasses,
} from '../../../utilities/resolveValidationLocales.js'
import { validateOperation } from '../validate.js'

/**
 * Options for validating a global document without persisting it.
 *
 * Global validation always simulates update. Candidate data is optional and, when provided, is
 * merged over the stored global before validation.
 */
export type ValidateGlobalOptions<TSlug extends GlobalSlug> = {
  /** Hook context merged into `req.context` for the validation lifecycle. */
  context?: RequestContext
  /** Optional partial data to merge over the stored global. */
  data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  /** One locale, a non-empty locale array, or every available locale. */
  locale: ValidationLocaleSelector
  /**
   * Skip global and field access control.
   * @default true
   */
  overrideAccess?: boolean
  /** An existing request to reuse for user, locale, and context. */
  req?: Partial<PayloadRequest>
  /** The global slug to validate against. */
  slug: TSlug
  /** The user used by access control when `overrideAccess` is `false`. */
  user?: null | User
} & DraftFlagFromGlobalSlug<TSlug>

type InternalValidateGlobalOptions<TSlug extends GlobalSlug> = {
  validationDataLocale?: string
} & ValidateGlobalOptions<TSlug>

export async function validateGlobalLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: ValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  return validateGlobalLocalWithDataLocale(payload, options)
}

export async function validateGlobalLocalWithDataLocale<TSlug extends GlobalSlug>(
  payload: Payload,
  options: InternalValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  const { slug, data, locale, overrideAccess = true, validationDataLocale } = options

  if (locale === undefined) {
    throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
  }

  const globalConfig = payload.globals.config.find((config) => config.slug === slug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(slug)} can't be found. Validate Operation.`)
  }

  const baseReq = await createLocalReq(
    {
      context: options.context,
      fallbackLocale: false,
      req: cloneValidationRequest(options.req),
      user: options.user ?? undefined,
    },
    payload,
  )
  const locales = await resolveValidationLocales({
    locale,
    req: baseReq,
  })
  const results = await runValidationLocalePasses({
    locales,
    validate: async (validationLocale) => {
      const req = await createLocalReq(
        {
          fallbackLocale: false,
          locale: validationLocale ?? undefined,
          req: cloneValidationRequest(baseReq),
        },
        payload,
      )
      const validationData =
        validationDataLocale && validationLocale !== validationDataLocale && data
          ? filterDataToSelectedLocales({
              configBlockReferences: payload.config.blocks,
              docWithLocales: data as JsonObject,
              fields: globalConfig.fields,
              selectedLocales: [],
            })
          : data

      return validateOperation({
        slug,
        data: validationData,
        globalConfig,
        overrideAccess,
        req,
      })
    },
  })
  const errors = results.flatMap((result) => result.errors)

  return {
    errors,
    valid: errors.length === 0,
  }
}
