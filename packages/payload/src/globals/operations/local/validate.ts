import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { ValidationResult } from '../../../collections/operations/local/validate.js'
import type { GlobalSlug, Payload, RequestContext, TypedLocale, User } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'
import type { DataFromGlobalSlug, DraftFlagFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
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
  /** The single locale to validate. Arrays and `'all'` are not accepted. */
  locale: TypedLocale
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

export async function validateGlobalLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: ValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  const { slug, data, locale, overrideAccess = true } = options

  if (locale === undefined || locale === 'all' || Array.isArray(locale)) {
    throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
  }

  const globalConfig = payload.globals.config.find((config) => config.slug === slug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(slug)} can't be found. Validate Operation.`)
  }

  const req = await createLocalReq(
    {
      ...(options as CreateLocalReqOptions),
      fallbackLocale: false,
    },
    payload,
  )

  return validateOperation({
    slug,
    data,
    globalConfig,
    overrideAccess,
    req,
  })
}
