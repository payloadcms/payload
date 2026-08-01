import type { DeepPartial } from 'ts-essentials'

import { z } from 'zod'

import type {
  CollectionSlug,
  FindOptions,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  DraftFlagFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { APIError } from '../../errors/index.js'
import {
  defineLocalAPI,
  defineOperation,
  invokeOperation,
} from '../../operations/defineOperation.js'
import { prepareCollectionOperationData } from '../../operations/prepareData.js'
import { collectionInput, dataSchema, idSchema } from '../../operations/schemaFields.js'
import { create } from './create.js'

type DuplicateLocalMethod = <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  options: LocalAPIOptions<DuplicateOptions<TSlug, TSelect>>,
) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>

const duplicateSchema = z
  .looseObject({
    ...collectionInput,
    id: idSchema.describe('The ID of the document to duplicate'),
    data: dataSchema.describe('Fields to override on the duplicated document').optional(),
    draft: z.boolean().describe('Create the duplicate as a draft').optional().default(false),
    selectedLocales: z.array(z.string()).optional(),
    showHiddenFields: z.boolean().optional(),
  })
  .overwrite((input) => {
    const payload = (input.req as PayloadRequest | undefined)?.payload

    if (!payload || !input.data) {
      return input
    }

    return {
      ...input,
      data: prepareCollectionOperationData({
        collection: input.collection,
        config: payload.config,
        data: input.data,
      }),
    }
  })

export const duplicateLocalAPI = defineLocalAPI<DuplicateLocalMethod>()({ name: 'duplicate' })

export const duplicate = defineOperation({
  action: 'duplicate',
  expose: {
    local: duplicateLocalAPI,
    mcp: { name: 'duplicateDocument' },
    rest: [
      {
        method: 'post',
        path: '/:id/duplicate',
      },
    ],
  },
  handler: async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    payload: Payload,
    options: DuplicateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    const collection = payload.collections[options.collection]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(options.collection)} can't be found. Duplicate Operation.`,
      )
    }

    if (collection.config.disableDuplicate === true) {
      throw new APIError(
        `The collection with slug ${String(options.collection)} cannot be duplicated.`,
        400,
      )
    }

    const { id, ...createOptions } = options

    return invokeOperation(create, {
      context: payload,
      input: {
        ...createOptions,
        data: options.data || {},
        duplicateFromID: id,
      },
      validate: false,
    }) as Promise<TransformCollectionWithSelect<TSlug, TSelect>>
  },
  input: duplicateSchema,
  target: 'collection',
})

type DuplicateOptionsBase<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * [Context](https://payloadcms.com/docs/hooks/context), which will then be passed to `context` and `req.context`,
   * which can be read by hooks. Useful if you want to pass additional information to the hooks which
   * shouldn't be necessarily part of the document, for example a `triggerBeforeChange` option which can be read by the BeforeChange hook
   * to determine if it should run or not.
   */
  context?: RequestContext
  /**
   * Override the data for the document to duplicate.
   */
  data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, a [database transactions](https://payloadcms.com/docs/database/transactions) will not be initialized.
   * @default false
   */
  disableTransaction?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale
  /**
   * The ID of the document to duplicate from.
   */
  id: number | string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale
  /**
   * Skip access control.
   * Set to `false` if you want to respect Access Control for the operation, for example when fetching data for the front-end.
   * @default true
   */
  overrideAccess?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType
  /**
   * The `PayloadRequest` object. You can pass it to thread the current [transaction](https://payloadcms.com/docs/database/transactions), user and locale to the operation.
   * Recommended to pass when using the Local API from hooks, as usually you want to execute the operation within the current transaction.
   */
  req?: Partial<PayloadRequest>
  /**
   * Specifies which locales to include when duplicating localized fields. Non-localized data is always duplicated.
   * By default, all locales are duplicated.
   */
  selectedLocales?: string[]
  /**
   * Opt-in to receiving hidden fields. By default, they are hidden from returned documents in accordance to your config.
   * @default false
   */
  showHiddenFields?: boolean
  /**
   * If you set `overrideAccess` to `false`, you can pass a user to use against the access control checks.
   */
  user?: null | User
} & Pick<FindOptions<TSlug, TSelect>, 'select'>

export type DuplicateOptions<
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
> = DraftFlagFromCollectionSlug<TSlug> & DuplicateOptionsBase<TSlug, TSelect>
