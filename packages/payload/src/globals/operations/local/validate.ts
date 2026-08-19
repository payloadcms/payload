import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { ValidationResult } from '../../../collections/operations/local/validate.js'
import type { GlobalSlug, Payload, RequestContext, User } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { ValidationLocaleSelector } from '../../../utilities/resolveValidationLocales.js'
import type { DataFromGlobalSlug, DraftFlagFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { runLocaleScopedValidation } from '../../../utilities/runLocaleScopedValidation.js'
import { validateOperation } from '../validate.js'

/**
 * Options for validating a global document without persisting it.
 *
 * The stored main global is loaded by default. Set `draft: true` to use the newest available draft
 * version, falling back to the main global. Optional partial candidate data is merged over that
 * base. Access control, hooks, field access, and validators receive the first-class `validate`
 * operation.
 */
export type ValidateGlobalOptions<TSlug extends GlobalSlug> = {
  /** Hook context merged into `req.context` for the validation lifecycle. */
  context?: RequestContext
  /** Optional partial candidate data to merge over the selected stored global. */
  data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  /**
   * A locale, a non-empty locale array, or `'all'`.
   *
   * Each selected locale receives an independent copy of the same candidate `data`.
   * `'all'` resolves through `localization.filterAvailableLocales` when configured. Use `null`
   * for projects without localization.
   */
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
  /**
   * Whether `data` stores each localized field as a locale-code-keyed object, as the internal
   * publish-all-locales candidate does, rather than a flat, single-locale candidate.
   */
  dataIsLocaleKeyed?: boolean
  validationDataLocale?: string
} & ValidateGlobalOptions<TSlug>

export async function validateGlobalLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: ValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  return validateGlobalLocalWithDataLocale(payload, {
    slug: options.slug,
    context: options.context,
    data: options.data,
    draft: options.draft,
    locale: options.locale,
    overrideAccess: options.overrideAccess,
    req: options.req,
    user: options.user,
  })
}

export async function validateGlobalLocalWithDataLocale<TSlug extends GlobalSlug>(
  payload: Payload,
  options: InternalValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  const {
    slug,
    data,
    dataIsLocaleKeyed,
    locale,
    overrideAccess = true,
    validationDataLocale,
  } = options
  const { draft = false } = options

  if (locale === undefined) {
    throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
  }

  const globalConfig = payload.globals.config.find((config) => config.slug === slug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(slug)} can't be found. Validate Operation.`)
  }

  return runLocaleScopedValidation({
    context: options.context,
    data,
    fields: globalConfig.fields,
    locale,
    payload,
    req: options.req,
    runPass: ({ data: validationData, req }) =>
      validateOperation({
        slug,
        data: validationData,
        dataIsLocaleKeyed,
        draft,
        globalConfig,
        overrideAccess,
        req,
      }),
    user: options.user,
    validationDataLocale,
  })
}
