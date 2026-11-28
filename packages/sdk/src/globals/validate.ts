import type { GlobalSlug, PayloadTypesShape, ValidationResult } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { ValidationLocaleOption } from '../collections/validate.js'
import type { PayloadSDK } from '../index.js'
import type { DataFromGlobalSlug } from '../types.js'

export type ValidateGlobalOptions<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>> = {
  /**
   * Partial data to merge over the newest draft of the global (or the global itself) before
   * validating. Nothing is saved.
   */
  data?: DeepPartial<DataFromGlobalSlug<T, TSlug>>
  /**
   * A locale, a non-empty array of locales, or `'all'`. Each selected locale validates its own copy
   * of `data`. Defaults to the request locale.
   */
  locale?: ValidationLocaleOption<T>
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
}

export async function validateGlobal<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>>(
  sdk: PayloadSDK<T>,
  options: ValidateGlobalOptions<T, TSlug>,
  init?: RequestInit,
): Promise<ValidationResult> {
  const response = await sdk.request({
    args: { locale: options.locale },
    init,
    json: options.data ?? {},
    method: 'POST',
    path: `/globals/${options.slug}/validate`,
  })

  return response.json()
}
