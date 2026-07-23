import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type {
  CollectionSlug,
  Payload,
  RequestContext,
  User,
  ValidationFieldError,
} from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { ValidationLocaleSelector } from '../../../utilities/resolveValidationLocales.js'
import type {
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../../config/types.js'

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
  /** One locale, a non-empty locale array, or every available locale. */
  locale: ValidationLocaleSelector
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

type InternalValidateCollectionOptions<TSlug extends CollectionSlug> = {
  validationDataLocale?: string
} & ValidateCollectionOptions<TSlug>

export async function validateLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  return validateLocalWithDataLocale(payload, options)
}

export async function validateLocalWithDataLocale<TSlug extends CollectionSlug>(
  payload: Payload,
  options: InternalValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  const {
    id,
    collection: collectionSlug,
    data,
    locale,
    overrideAccess = true,
    validationDataLocale,
  } = options

  if (locale === undefined) {
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
              fields: collection.config.fields,
              selectedLocales: [],
            })
          : data

      return validateOperation({
        id,
        collection,
        data: validationData,
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
