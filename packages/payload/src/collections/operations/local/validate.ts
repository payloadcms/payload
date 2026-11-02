import type { DeepPartial } from 'ts-essentials'

import type {
  CollectionSlug,
  Payload,
  RequestContext,
  SharedLocalAPIOptions,
  User,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { ValidationResult } from '../../../types/validation.js'
import type { ValidationLocaleSelector } from '../../../utilities/resolveValidationLocales.js'
import type { ValidationSourceData } from '../../../utilities/runValidationLifecycle.js'
import type {
  DataFromCollectionSlug,
  DraftFlagFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { httpStatus } from '../../../utilities/httpStatus.js'
import { runLocaleScopedValidation } from '../../../utilities/runLocaleScopedValidation.js'
import { validateOperation } from '../validate.js'

type BaseOptions<TSlug extends CollectionSlug> = {
  /** The collection slug to validate against. */
  collection: TSlug
  /**
   * Hook context merged into `req.context` for the validation lifecycle.
   */
  context?: RequestContext
  /**
   * A locale, a non-empty locale array, or `'all'`. Defaults to the request locale, or the
   * configured default locale.
   *
   * Each selected locale receives an independent copy of the same candidate `data`.
   * `'all'` resolves through `localization.filterAvailableLocales` when configured.
   */
  locale?: ValidationLocaleSelector
  /**
   * An existing request to reuse for user, locale, and context.
   */
  req?: Partial<PayloadRequest>
  /**
   * The user used by access control when `overrideAccess` is `false`.
   */
  user?: null | User
} & DraftFlagFromCollectionSlug<TSlug> &
  Pick<SharedLocalAPIOptions, 'overrideAccess'>

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

export async function validateLocal<TSlug extends CollectionSlug>(
  payload: Payload,
  options: ValidateCollectionOptions<TSlug>,
): Promise<ValidationResult> {
  return validateLocalInternal({ options, payload })
}

export async function validateLocalWithLocaleKeyedData<TSlug extends CollectionSlug>({
  operation,
  options,
  payload,
  sourceData,
  trash,
}: {
  operation: 'create' | 'update'
  options: ValidateCollectionOptions<TSlug>
  payload: Payload
  sourceData?: ValidationSourceData
  trash?: boolean
}): Promise<ValidationResult> {
  return validateLocalInternal({
    dataIsLocaleKeyed: true,
    operation,
    options,
    payload,
    skipAccessControl: true,
    skipMutationHooks: true,
    sourceData,
    trash,
  })
}

async function validateLocalInternal<TSlug extends CollectionSlug>({
  dataIsLocaleKeyed = false,
  operation = 'validate',
  options,
  payload,
  skipAccessControl = false,
  skipMutationHooks = false,
  sourceData,
  trash,
}: {
  dataIsLocaleKeyed?: boolean
  operation?: 'create' | 'update' | 'validate'
  options: ValidateCollectionOptions<TSlug>
  payload: Payload
  skipAccessControl?: boolean
  skipMutationHooks?: boolean
  sourceData?: ValidationSourceData
  trash?: boolean
}): Promise<ValidationResult> {
  const {
    id,
    collection: collectionSlug,
    data,
    draft = false,
    locale,
    overrideAccess = false,
  } = options

  if (id === undefined && data === undefined) {
    throw new APIError('Validation create simulation requires data.', httpStatus.BAD_REQUEST)
  }

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Validate Operation.`,
    )
  }

  return runLocaleScopedValidation({
    context: options.context,
    data,
    dataIsLocaleKeyed,
    fields: collection.config.fields,
    locale,
    operation,
    payload,
    req: options.req,
    runPass: ({ data: validationData, onValidationData, req }) =>
      validateOperation({
        id,
        collection,
        data: validationData,
        draft,
        onValidationData,
        overrideAccess,
        req,
        skipAccessControl,
        skipMutationHooks,
        sourceData,
        trash,
        validationOperation: operation,
      }),
    user: options.user,
  })
}
