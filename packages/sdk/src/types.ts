import type {
  AuthCollectionSlug,
  CollectionSlug,
  CreateAction,
  CreateDataFromCollectionSlug,
  DraftTransformCollectionWithSelect,
  DraftTransformGlobalWithSelect,
  GlobalSlug,
  JsonObject,
  PayloadTypesShape,
  QueryDraftDataFromCollection,
  QueryDraftDataFromCollectionSlug,
  QueryDraftDataFromGlobalSlug,
  ReadVersion,
  RestoreAction,
  RestoreActionFromCollectionSlug,
  RestoreActionFromGlobalSlug,
  SelectType,
  Sort,
  TransformDataWithSelect,
  TypeWithID,
  UpdateAction,
  UpdateActionFromCollectionSlug,
  UpdateActionFromGlobalSlug,
  VersionFromCollectionSlug,
  VersionFromGlobalSlug,
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

export type CollectionVersionOptions<TSlug> = TSlug extends CollectionSlug
  ? VersionFromCollectionSlug<TSlug>
  : {
      /**
       * Which document representation to read. [More](https://payloadcms.com/docs/versions/drafts)
       *
       * @default 'published'
       */
      version?: ReadVersion
    }

export type CollectionCreateWriteOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
> = TSlug extends CollectionSlug
  ? CreateDataFromCollectionSlug<TSlug>
  : {
      action?: CreateAction
      data: RequiredDataFromCollectionSlug<T, TSlug>
    }

export type CollectionUpdateActionOptions<TSlug> = TSlug extends CollectionSlug
  ? UpdateActionFromCollectionSlug<TSlug>
  : {
      action?: UpdateAction
    }

export type CollectionRestoreActionOptions<TSlug> = TSlug extends CollectionSlug
  ? RestoreActionFromCollectionSlug<TSlug>
  : {
      /**
       * Restore and publish (`publish`, default) or restore as a draft (`saveDraft`).
       */
      action?: RestoreAction
    }

export type GlobalVersionOptions<TSlug> = TSlug extends GlobalSlug
  ? VersionFromGlobalSlug<TSlug>
  : {
      /**
       * Which document representation to read. [More](https://payloadcms.com/docs/versions/drafts)
       *
       * @default 'published'
       */
      version?: ReadVersion
    }

export type GlobalUpdateActionOptions<TSlug> = TSlug extends GlobalSlug
  ? UpdateActionFromGlobalSlug<TSlug>
  : {
      action?: UpdateAction
    }

export type GlobalRestoreActionOptions<TSlug> = TSlug extends GlobalSlug
  ? RestoreActionFromGlobalSlug<TSlug>
  : {
      /**
       * Restore and publish (`publish`, default) or restore as a draft (`saveDraft`).
       */
      action?: RestoreAction
    }

export type TransformCollectionWithSelectByVersion<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect,
  TVersion extends ReadVersion | undefined,
> = TVersion extends 'draft' | 'latest'
  ? TSlug extends CollectionSlug
    ? TSelect extends SelectType
      ? DraftTransformCollectionWithSelect<TSlug, TSelect>
      : QueryDraftDataFromCollectionSlug<TSlug>
    : TransformCollectionWithSelect<T, TSlug, TSelect>
  : TransformCollectionWithSelect<T, TSlug, TSelect>

export type TransformAuthWithVersion<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
  TVersion extends ReadVersion | undefined,
> = TVersion extends 'draft' | 'latest'
  ? DataFromAuthSlug<T, TSlug> extends JsonObject
    ? QueryDraftDataFromCollection<DataFromAuthSlug<T, TSlug>>
    : DataFromAuthSlug<T, TSlug>
  : DataFromAuthSlug<T, TSlug>

export type TransformGlobalWithSelectByVersion<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect,
  TVersion extends ReadVersion | undefined,
> = TVersion extends 'draft' | 'latest'
  ? TSlug extends GlobalSlug
    ? TSelect extends SelectType
      ? DraftTransformGlobalWithSelect<TSlug, TSelect>
      : QueryDraftDataFromGlobalSlug<TSlug>
    : TransformGlobalWithSelect<T, TSlug, TSelect>
  : TransformGlobalWithSelect<T, TSlug, TSelect>
