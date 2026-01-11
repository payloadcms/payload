import type {
  CollectionSlug,
  GeneratedTypesShape,
  GlobalSlug,
  JsonObject,
  SelectType,
  Sort,
  TransformDataWithSelect,
  TypedCollection,
  TypedCollectionJoins,
  TypedCollectionSelect,
  TypedGlobal,
  TypedGlobalSelect,
  Where,
} from 'payload'
import type { MarkOptional } from 'ts-essentials'

// TODO: Investigate reusing the types from payload
export type DataFromCollectionSlug<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = TypedCollection<TGeneratedTypes>[TSlug]

// TODO: Investigate reusing the types from payload
export type DataFromGlobalSlug<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
> = TypedGlobal<TGeneratedTypes>[TSlug]

export type SelectFromCollectionSlug<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = TypedCollectionSelect<TGeneratedTypes>[TSlug]

export type SelectFromGlobalSlug<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
> = TypedGlobalSelect<TGeneratedTypes>[TSlug]

export type TransformCollectionWithSelect<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromCollectionSlug<TGeneratedTypes, TSlug>, TSelect>
  : DataFromCollectionSlug<TGeneratedTypes, TSlug>

export type TransformGlobalWithSelect<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
  TSelect extends SelectType,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromGlobalSlug<TGeneratedTypes, TSlug>, TSelect>
  : DataFromGlobalSlug<TGeneratedTypes, TSlug>

export type RequiredDataFromCollection<TData extends JsonObject> = MarkOptional<
  TData,
  'createdAt' | 'id' | 'sizes' | 'updatedAt'
>

export type RequiredDataFromCollectionSlug<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = RequiredDataFromCollection<DataFromCollectionSlug<TGeneratedTypes, TSlug>>

export type JoinQuery<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> =
  TypedCollectionJoins<TGeneratedTypes>[TSlug] extends Record<string, string>
    ?
        | false
        | Partial<{
            [K in keyof TypedCollectionJoins<TGeneratedTypes>[TSlug]]:
              | {
                  count?: boolean
                  limit?: number
                  page?: number
                  sort?: Sort
                  where?: Where
                }
              | false
          }>
    : never

export type PopulateType<TGeneratedTypes extends GeneratedTypesShape> = Partial<
  TypedCollectionSelect<TGeneratedTypes>
>

export type IDType<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = DataFromCollectionSlug<TGeneratedTypes, TSlug>['id']

export type BulkOperationResult<
  TGeneratedTypes extends GeneratedTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
  TSelect extends SelectType,
> = {
  docs: TransformCollectionWithSelect<TGeneratedTypes, TSlug, TSelect>[]
  errors: {
    id: DataFromCollectionSlug<TGeneratedTypes, TSlug>['id']
    message: string
  }[]
}
