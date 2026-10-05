import type { DeepPartial } from 'ts-essentials'

import type {
  GlobalSlug,
  Payload,
  RequestContext,
  SharedLocalAPIOptions,
  User,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { ValidationResult } from '../../../types/validation.js'
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
   * A locale, a non-empty locale array, or `'all'`. Defaults to the request locale, or the
   * configured default locale.
   *
   * Each selected locale receives an independent copy of the same candidate `data`.
   * `'all'` resolves through `localization.filterAvailableLocales` when configured.
   */
  locale?: ValidationLocaleSelector
  /** An existing request to reuse for user, locale, and context. */
  req?: Partial<PayloadRequest>
  /** The global slug to validate against. */
  slug: TSlug
  /** The user used by access control when `overrideAccess` is `false`. */
  user?: null | User
} & DraftFlagFromGlobalSlug<TSlug> &
  Pick<SharedLocalAPIOptions, 'overrideAccess'>

export async function validateGlobalLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: ValidateGlobalOptions<TSlug>,
): Promise<ValidationResult> {
  const { slug, data, locale, overrideAccess = false } = options
  const { draft = false } = options

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
    runPass: ({ data: validationData, onValidationData, req }) =>
      validateOperation({
        slug,
        data: validationData,
        draft,
        globalConfig,
        onValidationData,
        overrideAccess,
        req,
      }),
    user: options.user,
  })
}
