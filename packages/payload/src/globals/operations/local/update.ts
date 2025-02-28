// @ts-strict-ignore
import type { DeepPartial } from 'ts-essentials'

import type {
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformGlobalWithSelect,
} from '../../../types/index.js'
import type { DataFromGlobalSlug, SelectFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import {
  deepCopyObjectSimple,
  type GlobalSlug,
  type Payload,
  type RequestContext,
  type TypedLocale,
} from '../../../index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'

export type Options<TSlug extends GlobalSlug, TSelect extends SelectType> = {
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
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
   * Update documents to a draft.
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the fron-end.
   * @default true
   */
  overrideAccess?: boolean
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
   * Publish the document / documents with a specific locale.
   */
  publishSpecificLocale?: TypedLocale
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
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
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: Document
}

export default async function updateLocal<
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
    overrideAccess = true,
    overrideLock,
    populate,
    publishSpecificLocale,
    select,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return updateOperation<TSlug, TSelect>({
    slug: globalSlug as string,
    data: deepCopyObjectSimple(data), // Ensure mutation of data in create operation hooks doesn't affect the original data
    depth,
    draft,
    globalConfig,
    overrideAccess,
    overrideLock,
    populate,
    publishSpecificLocale,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
