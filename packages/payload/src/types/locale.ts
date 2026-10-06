/**
 * Write data for `locale: 'all'`, allowing locale maps at any field or nested field.
 * Generated document types do not identify localized fields, so ordinary field values
 * remain valid for shared data and locale maps retain the generated value types.
 */
export type AllLocalesData<TData, TLocale extends string> = {
  [TKey in keyof TData]: TKey extends 'collection' | 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'
    ? TData[TKey]
    : AllLocalesField<TData[TKey], TLocale>
}

/** Keep single-locale data unchanged, and accept locale maps only for explicit all-locale writes. */
export type LocaleDataOptions<TData, TLocale> =
  | {
      data: AllLocalesData<
        TData,
        [Extract<TLocale, string>] extends [never] ? string : Extract<TLocale, string>
      >
      locale: 'all'
    }
  | {
      data: TData
      locale?: TLocale
    }

type AllLocalesField<TData, TLocale extends string> =
  | AllLocalesValue<TData, TLocale>
  | Partial<Record<TLocale, AllLocalesValue<TData, TLocale>>>

type AllLocalesValue<TData, TLocale extends string> = TData extends object
  ? AllLocalesData<TData, TLocale>
  : TData
