import type {
  CollectionSlug,
  GlobalSlug,
  JsonObject,
  PayloadTypesShape,
  SelectType,
  Sort,
  TransformDataWithSelect,
  TypedCollection,
  TypedCollectionJoins,
  TypedCollectionSelect,
  TypedGlobal,
  TypedGlobalSelect,
  TypeWithID,
  UntypedPayloadTypes,
  Where,
} from 'payload'
import type { MarkOptional } from 'ts-essentials'

/**
 * SDK-specific wrappers that ensure indexability when TGeneratedTypes is a generic parameter.
 * The intersection with the untyped version ensures TypeScript knows the result is always indexable.
 */
type IndexableCollection<TGeneratedTypes extends PayloadTypesShape> =
  TypedCollection<TGeneratedTypes> & UntypedPayloadTypes['collections']

type IndexableGlobal<TGeneratedTypes extends PayloadTypesShape> = TypedGlobal<TGeneratedTypes> &
  UntypedPayloadTypes['globals']

type IndexableCollectionSelect<TGeneratedTypes extends PayloadTypesShape> =
  TypedCollectionSelect<TGeneratedTypes> & UntypedPayloadTypes['collectionsSelect']

type IndexableGlobalSelect<TGeneratedTypes extends PayloadTypesShape> =
  TypedGlobalSelect<TGeneratedTypes> & UntypedPayloadTypes['globalsSelect']

type IndexableCollectionJoins<TGeneratedTypes extends PayloadTypesShape> =
  TypedCollectionJoins<TGeneratedTypes> & UntypedPayloadTypes['collectionsJoins']

export type DataFromCollectionSlug<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = IndexableCollection<TGeneratedTypes>[TSlug]

export type DataFromGlobalSlug<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
> = IndexableGlobal<TGeneratedTypes>[TSlug]

export type SelectFromCollectionSlug<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = IndexableCollectionSelect<TGeneratedTypes>[TSlug]

export type SelectFromGlobalSlug<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
> = IndexableGlobalSelect<TGeneratedTypes>[TSlug]

export type TransformCollectionWithSelect<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
  TSelect,
> = TSelect extends SelectType
  ? TransformDataWithSelect<
      DataFromCollectionSlug<TGeneratedTypes, TSlug> & (JsonObject & TypeWithID),
      TSelect
    >
  : DataFromCollectionSlug<TGeneratedTypes, TSlug>

export type TransformGlobalWithSelect<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends GlobalSlug<TGeneratedTypes>,
  TSelect,
> = TSelect extends SelectType
  ? TransformDataWithSelect<DataFromGlobalSlug<TGeneratedTypes, TSlug> & JsonObject, TSelect>
  : DataFromGlobalSlug<TGeneratedTypes, TSlug>

export type RequiredDataFromCollection<TData> = MarkOptional<
  JsonObject & TData,
  'createdAt' | 'id' | 'sizes' | 'updatedAt'
>

export type RequiredDataFromCollectionSlug<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = RequiredDataFromCollection<DataFromCollectionSlug<TGeneratedTypes, TSlug>>

export type JoinQuery<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> =
  IndexableCollectionJoins<TGeneratedTypes>[TSlug] extends Record<string, string>
    ?
        | false
        | Partial<{
            [K in keyof IndexableCollectionJoins<TGeneratedTypes>[TSlug]]:
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

export type PopulateType<TGeneratedTypes extends PayloadTypesShape> = Partial<
  IndexableCollectionSelect<TGeneratedTypes>
>

export type IDType<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
> = (DataFromCollectionSlug<TGeneratedTypes, TSlug> & TypeWithID)['id']

export type BulkOperationResult<
  TGeneratedTypes extends PayloadTypesShape,
  TSlug extends CollectionSlug<TGeneratedTypes>,
  TSelect,
> = {
  docs: TransformCollectionWithSelect<TGeneratedTypes, TSlug, TSelect>[]
  errors: {
    id: IDType<TGeneratedTypes, TSlug>
    message: string
  }[]
}
