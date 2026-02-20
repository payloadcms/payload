import type {
  AuthCollectionSlug,
  CollectionSlug,
  GlobalSlug,
  JsonObject,
  PayloadTypesShape,
  SelectType,
  Sort,
  TransformDataWithSelect,
  TypedCollectionSelect,
  TypeWithID,
  Where,
} from 'payload'

// Simple property access - PayloadTypesShape guarantees these properties exist
export type DataFromCollectionSlug<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
> = T['collections'][TSlug]

// Helper for auth endpoints where TSlug is AuthCollectionSlug but we need collection data
export type DataFromAuthSlug<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
> = T['collections'][CollectionSlug<T> & TSlug]

export type DataFromGlobalSlug<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
> = T['globals'][TSlug]

// Intersection with SelectType ensures TypeScript knows the result satisfies SelectType
// while preserving the specific collection select type for inference
export type SelectFromCollectionSlug<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
> = TSlug extends keyof T['collectionsSelect'] ? T['collectionsSelect'][TSlug] : SelectType

export type SelectFromGlobalSlug<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
> = TSlug extends keyof T['globalsSelect'] ? T['globalsSelect'][TSlug] : SelectType

export type TransformCollectionWithSelect<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect,
> = TSelect extends SelectType
  ? TransformDataWithSelect<
      T['collections'][TSlug] extends JsonObject
        ? T['collections'][TSlug]
        : JsonObject & TypeWithID,
      TSelect
    >
  : T['collections'][TSlug]

export type TransformGlobalWithSelect<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect,
> = TSelect extends SelectType
  ? TransformDataWithSelect<
      T['globals'][TSlug] extends JsonObject ? T['globals'][TSlug] : JsonObject & TypeWithID,
      TSelect
    >
  : T['globals'][TSlug]

type SystemFields = 'createdAt' | 'id' | 'sizes' | 'updatedAt'

export type RequiredDataFromCollection<TData> = Omit<TData, SystemFields> &
  Partial<Pick<Record<SystemFields, unknown> & TData, SystemFields>>

export type RequiredDataFromCollectionSlug<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
> = RequiredDataFromCollection<T['collections'][TSlug]>

export type JoinQuery<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> =
  T['collectionsJoins'][TSlug] extends Record<string, string>
    ?
        | false
        | Partial<{
            [K in keyof T['collectionsJoins'][TSlug]]:
              | { count?: boolean; limit?: number; page?: number; sort?: Sort; where?: Where }
              | false
          }>
    : never

export type PopulateType<T extends PayloadTypesShape> = Partial<T['collectionsSelect']>

export type IDType<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
> = (T['collections'][TSlug] & TypeWithID)['id']

export type BulkOperationResult<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect,
> = {
  docs: TransformCollectionWithSelect<T, TSlug, TSelect>[]
  errors: { id: IDType<T, TSlug>; message: string }[]
}
