import type { DeepPartial } from 'ts-essentials'

import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformGlobalWithSelect,
} from '../../../types/index.js'
import type { SharedLocalAPIOptions } from '../../../types/operations.js'
import type { CreatePayloadRequestArgs } from '../../../utilities/createPayloadRequest.js'
import type {
  DataFromGlobalSlug,
  DraftFlagFromGlobalSlug,
  SelectFromGlobalSlug,
} from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import {
  deepCopyObjectSimple,
  type FindOptions,
  type GlobalSlug,
  type Payload,
  type RequestContext,
  type TypedLocale,
  type User,
} from '../../../index.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { updateOperation } from '../update.js'

const MAX_TRANSIENT_TRANSACTION_ATTEMPTS = 10

type BaseOptions<TSlug extends GlobalSlug, TSelect extends SelectType> = {
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  /**
   * Read and write against a specific content branch instead of resolving one
   * from the request. `false` bypasses branching entirely.
   */
  branch?: false | string
  context?: RequestContext
  /**
   * The global data to update.
   */
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
  /**
   * If you are uploading a file and would like to replace
   * the existing file instead of generating a new filename,
   * you can set the following property to `true`
   */
  overrideLock?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * Publish the document / documents in all locales. Only applies when localization is enabled
   * and the global has localized fields.
   *
   * @default undefined
   */
  publishAllLocales?: boolean
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * Unpublish the document / documents in all locales. Only applies when localization is enabled
   * and the global has localized fields.
   */
  unpublishAllLocales?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<string, SelectType>, 'select'> &
  Pick<SharedLocalAPIOptions, 'overrideAccess'>

export type Options<TSlug extends GlobalSlug, TSelect extends SelectType> = BaseOptions<
  TSlug,
  TSelect
> &
  DraftFlagFromGlobalSlug<TSlug>

export async function updateGlobalLocal<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<TransformGlobalWithSelect<TSlug, TSelect>> {
  const {
    slug: globalSlug,
    data,
    depth,
    draft,
    overrideAccess = false,
    overrideLock,
    populate,
    publishAllLocales,
    select,
    showHiddenFields,
    unpublishAllLocales,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const hasIncomingTransaction = Boolean(options.req?.transactionID)

  for (let attempt = 0; attempt < MAX_TRANSIENT_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await updateOperation<TSlug, TSelect>({
        slug: globalSlug as string,
        // Each attempt starts from the caller's input because field and global hooks may mutate data.
        data: deepCopyObjectSimple(data),
        depth,
        draft,
        globalConfig,
        overrideAccess,
        overrideLock,
        populate,
        publishAllLocales,
        req: await createGlobalUpdateRequest({ hasIncomingTransaction, options, payload }),
        select,
        showHiddenFields,
        unpublishAllLocales,
      })
    } catch (error) {
      if (
        hasIncomingTransaction ||
        !isTransientTransactionConflict(error) ||
        attempt === MAX_TRANSIENT_TRANSACTION_ATTEMPTS - 1
      ) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 20))
    }
  }

  throw new Error('Global update transaction retry limit reached.')
}

const createGlobalUpdateRequest = async <
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>({
  hasIncomingTransaction,
  options,
  payload,
}: {
  hasIncomingTransaction: boolean
  options: Options<TSlug, TSelect>
  payload: Payload
}): Promise<PayloadRequest> => {
  let req = options.req

  if (req && !hasIncomingTransaction) {
    req = isolateObjectProperty(req, ['branch', 'context', 'payloadDataLoader', 'transactionID'])
    req.context = { ...options.req?.context }
    delete req.payloadDataLoader
    delete req.transactionID
  }

  return createPayloadRequest({
    ...(options as Omit<CreatePayloadRequestArgs, 'payload'>),
    payload,
    req,
  })
}

const isTransientTransactionConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const transactionError = error as {
    code?: unknown
    codeName?: unknown
    errorLabels?: unknown
  }

  return (
    transactionError.code === 112 ||
    transactionError.codeName === 'WriteConflict' ||
    (Array.isArray(transactionError.errorLabels) &&
      transactionError.errorLabels.includes('TransientTransactionError'))
  )
}
