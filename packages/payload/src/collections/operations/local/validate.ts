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
import { projectNonLocalizedData } from '../../../utilities/projectNonLocalizedData.js'
import {
  cloneValidationRequest,
  cloneValidationValue,
  resolveValidationConcurrency,
  resolveValidationLocales,
  runValidationLocalePasses,
} from '../../../utilities/resolveValidationLocales.js'
import { validateOperation } from '../validate.js'

/**
 * The result of validating a collection or global document candidate without persisting it.
 *
 * Field validation failures are returned in this result. Access denials, invalid arguments,
 * missing documents, and other lifecycle errors throw instead.
 */
export type ValidationResult = {
  /**
   * Field validation errors. Errors from localized passes are tagged with the locale that failed;
   * non-localized validation may omit the locale.
   * Empty when {@link valid} is `true`.
   */
  errors: ValidationFieldError[]
  /** Whether the candidate passed field validation in every selected locale. */
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
   * A locale, a non-empty locale array, or `'all'`.
   *
   * Each selected locale receives an independent copy of the same candidate `data`.
   * `'all'` resolves through `localization.filterAvailableLocales` when configured. Use `null`
   * for projects without localization.
   */
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
 * Omitting `id` validates create candidate data. Supplying `id` loads the stored main document by
 * default. Set `draft: true` to use the newest available draft version, falling back to the main
 * document. Optional partial data is merged over that base. Access control, hooks, field access,
 * and validators receive the first-class `validate` operation in both cases.
 */
export type ValidateCollectionOptions<TSlug extends CollectionSlug> =
  | ({
      /**
       * Candidate create data. This property is required, but its fields may be incomplete or
       * invalid so callers can inspect the returned errors.
       */
      data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
      /** Create candidate validation does not accept a document ID. */
      id?: never
    } & BaseOptions<TSlug>)
  | ({
      /** Optional partial candidate data to merge over the selected stored document. */
      data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
      /** ID of the stored document used as the candidate's base. */
      id: DataFromCollectionSlug<TSlug>['id']
    } & BaseOptions<TSlug>)

type InternalValidateCollectionOptions<TSlug extends CollectionSlug> = {
  validationDataLocale?: string
  validationTrash?: boolean
} & ValidateCollectionOptions<TSlug>

export async function validateLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  const publicOptions = {
    collection: options.collection,
    context: options.context,
    draft: options.draft,
    locale: options.locale,
    overrideAccess: options.overrideAccess,
    req: options.req,
    user: options.user,
  }

  if (options.id === undefined) {
    return validateLocalWithDataLocale(payload, {
      ...publicOptions,
      data: options.data,
    })
  }

  return validateLocalWithDataLocale(payload, {
    ...publicOptions,
    id: options.id,
    data: options.data,
  })
}

export async function validateLocalWithDataLocale<TSlug extends CollectionSlug>(
  payload: Payload,
  options: InternalValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  const {
    id,
    collection: collectionSlug,
    data,
    draft = false,
    locale,
    overrideAccess = true,
    validationDataLocale,
    validationTrash,
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
      context: cloneValidationValue(options.context),
      fallbackLocale: false,
      req: cloneValidationRequest(options.req),
      user: cloneValidationValue(options.user),
    },
    payload,
  )
  baseReq.operation = 'validate'
  const locales = await resolveValidationLocales({
    locale,
    req: baseReq,
  })
  const results = await runValidationLocalePasses({
    concurrency: resolveValidationConcurrency(options.req),
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
      const validationCandidateData = cloneValidationValue(data)
      const validationData =
        validationDataLocale && validationLocale !== validationDataLocale && validationCandidateData
          ? projectNonLocalizedData({
              configBlockReferences: payload.config.blocks,
              data: validationCandidateData as JsonObject,
              fields: collection.config.fields,
            })
          : validationCandidateData

      return validateOperation({
        id,
        collection,
        data: validationData,
        draft,
        overrideAccess,
        req,
        trash: validationTrash,
      })
    },
  })
  const errors = results.flatMap((result) => result.errors)

  return {
    errors,
    valid: errors.length === 0,
  }
}
