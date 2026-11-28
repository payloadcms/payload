import type { CollectionSlug, PayloadTypesShape, TypedLocale, ValidationResult } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type { RequiredDataFromCollectionSlug } from '../types.js'

export type ValidationLocaleOption<T extends PayloadTypesShape> =
  | 'all'
  | readonly [TypedLocale<T>, ...TypedLocale<T>[]]
  | TypedLocale<T>

type ValidateBaseOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * A locale, a non-empty array of locales, or `'all'`. Each selected locale validates its own copy
   * of `data`. Defaults to the request locale.
   */
  locale?: ValidationLocaleOption<T>
}

/**
 * Without `id`, validates data for a new document. With `id`, merges `data` over the newest draft
 * of that document (or the document itself) and validates the result. Nothing is saved.
 */
export type ValidateOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> =
  | ({
      /**
       * Data for the new document. Fields may be missing or invalid, that's what the result reports.
       */
      data: DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>
      id?: never
    } & ValidateBaseOptions<T, TSlug>)
  | ({
      /**
       * Partial data to merge over the stored document before validating.
       */
      data?: DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>
      /**
       * The ID of the stored document to validate.
       */
      id: number | string
    } & ValidateBaseOptions<T, TSlug>)

export async function validate<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: ValidateOptions<T, TSlug>,
  init?: RequestInit,
): Promise<ValidationResult> {
  const response = await sdk.request({
    args: { locale: options.locale },
    init,
    json: options.data ?? {},
    method: 'POST',
    path: `/${options.collection}${options.id === undefined ? '' : `/${encodeURIComponent(String(options.id))}`}/validate`,
  })

  return response.json()
}
