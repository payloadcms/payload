import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type {
  CollectionSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
  ValidationFieldError,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { CreateLocalReqOptions } from '../../../utilities/createLocalReq.js'
import type {
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { validateOperation } from '../validate.js'

/**
 * The result of validating a collection or global document without persisting it.
 */
export type ValidationResult = {
  /** Field validation errors. Empty when {@link valid} is `true`. */
  errors: ValidationFieldError[]
  /** Whether the simulated document passed field validation. */
  valid: boolean
}

type BaseOptions<TSlug extends CollectionSlug> = {
  /** The collection slug to validate against. */
  collection: TSlug
  /**
   * Hook context merged into `req.context` for the validation lifecycle.
   */
  context?: RequestContext
  /**
   * A fallback locale used while constructing the validation request.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The single locale to validate. Arrays and `'all'` are not accepted by this operation.
   */
  locale: TypedLocale
  /**
   * Skip collection and field access control.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * An existing request to reuse for user, locale, and context.
   */
  req?: Partial<PayloadRequest>
  /**
   * The user used by access control when `overrideAccess` is `false`.
   */
  user?: null | User
} & DraftFlagFromCollectionSlug<TSlug>

/**
 * Options for validating a collection document without persisting it.
 *
 * Omitting `id` simulates create and requires `data`. Supplying `id` simulates update and allows
 * `data` to be omitted or partial because stored document data is loaded first.
 */
export type ValidateCollectionOptions<TSlug extends CollectionSlug> =
  | ({
      /** Candidate create data. The property is required, but fields may be incomplete or invalid. */
      data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
      /** Create simulation does not accept a document ID. */
      id?: never
    } & BaseOptions<TSlug>)
  | ({
      /** Optional partial data to merge over the stored document. */
      data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
      /** The stored document ID used for update simulation. */
      id: DataFromCollectionSlug<TSlug>['id']
    } & BaseOptions<TSlug>)

export async function validateLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  const { id, collection: collectionSlug, data, locale, overrideAccess = true } = options

  if (locale === undefined || locale === 'all' || Array.isArray(locale)) {
    throw new APIError('Validation requires a locale.', httpStatus.BAD_REQUEST)
  }

  if (id === undefined && data === undefined) {
    throw new APIError('Validation create simulation requires data.', httpStatus.BAD_REQUEST)
  }

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Validate Operation.`,
    )
  }

  const req = await createLocalReq(options as CreateLocalReqOptions, payload)

  return validateOperation({
    id,
    collection,
    data,
    overrideAccess,
    req,
  })
}
