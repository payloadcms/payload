import type {
  JsonObject,
  SelectType,
  StringKeyOf,
  TransformDataWithSelect,
  TypeWithID,
  Where,
} from 'payload'
import type { MarkOptional, NonNever } from 'ts-essentials'

export interface PayloadGeneratedTypes {
  auth: {
    [slug: string]: {
      forgotPassword: {
        email: string
      }
      login: {
        email: string
        password: string
      }
      registerFirstUser: {
        email: string
        password: string
      }
      unlock: {
        email: string
      }
    }
  }

  collections: {
    [slug: string]: JsonObject & TypeWithID
  }
  collectionsJoins: {
    [slug: string]: {
      [schemaPath: string]: string
    }
  }

  collectionsSelect: {
    [slug: string]: any
  }
  db: {
    defaultIDType: number | string
  }
  globals: {
    [slug: string]: JsonObject
  }

  globalsSelect: {
    [slug: string]: any
  }

  locale: null | string
}

export type TypedCollection<T extends PayloadGeneratedTypes> = T['collections']

export type TypedGlobal<T extends PayloadGeneratedTypes> = T['globals']

export type TypedCollectionSelect<T extends PayloadGeneratedTypes> = T['collectionsSelect']

export type TypedCollectionJoins<T extends PayloadGeneratedTypes> = T['collectionsJoins']

export type TypedGlobalSelect<T extends PayloadGeneratedTypes> = T['globalsSelect']

export type TypedAuth<T extends PayloadGeneratedTypes> = T['auth']

export type CollectionSlug<T extends PayloadGeneratedTypes> = StringKeyOf<TypedCollection<T>>

export type GlobalSlug<T extends PayloadGeneratedTypes> = StringKeyOf<TypedGlobal<T>>

export type AuthCollectionSlug<T extends PayloadGeneratedTypes> = StringKeyOf<TypedAuth<T>>

export type TypedUploadCollection<T extends PayloadGeneratedTypes> = NonNever<{
  [K in keyof TypedCollection<T>]:
    | 'filename'
    | 'filesize'
    | 'mimeType'
    | 'url' extends keyof TypedCollection<T>[K]
    ? TypedCollection<T>[K]
    : never
}>

export type UploadCollectionSlug<T extends PayloadGeneratedTypes> = StringKeyOf<
  TypedUploadCollection<T>
>

export type DataFromCollectionSlug<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = TypedCollection<T>[TSlug]

export type DataFromGlobalSlug<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
> = TypedGlobal<T>[TSlug]

export type SelectFromCollectionSlug<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = TypedCollectionSelect<T>[TSlug]

export type SelectFromGlobalSlug<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
> = TypedGlobalSelect<T>[TSlug]

export type TransformCollectionWithSelect<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromCollectionSlug<T, TSlug>, TSelect>
  : DataFromCollectionSlug<T, TSlug>

export type TransformGlobalWithSelect<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromGlobalSlug<T, TSlug>, TSelect>
  : DataFromGlobalSlug<T, TSlug>

export type RequiredDataFromCollection<TData extends JsonObject> = MarkOptional<
  TData,
  'createdAt' | 'id' | 'sizes' | 'updatedAt'
>

export type RequiredDataFromCollectionSlug<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = RequiredDataFromCollection<DataFromCollectionSlug<T, TSlug>>

export type TypedLocale<T extends PayloadGeneratedTypes> = NonNullable<T['locale']>

export type JoinQuery<T extends PayloadGeneratedTypes, TSlug extends CollectionSlug<T>> =
  TypedCollectionJoins<T>[TSlug] extends Record<string, string>
    ?
        | false
        | Partial<{
            [K in keyof TypedCollectionJoins<T>[TSlug]]:
              | {
                  limit?: number
                  sort?: string
                  where?: Where
                }
              | false
          }>
    : never

export type PopulateType<T extends PayloadGeneratedTypes> = Partial<TypedCollectionSelect<T>>

export type IDType<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = DataFromCollectionSlug<T, TSlug>['id']

export type BulkOperationResult<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  docs: TransformCollectionWithSelect<T, TSlug, TSelect>[]
  errors: {
    id: DataFromCollectionSlug<T, TSlug>['id']
    message: string
  }[]
}
