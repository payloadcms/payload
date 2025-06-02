import type { TypeWithID, Where, WhereField } from 'payload'
import type { DeepPartial, MarkOptional } from 'ts-essentials'

type CollectionDoc = {
  createdAt?: string
  id?: number | string
  sizes?: unknown
  updatedAt?: string
}

type BaseTypes = {
  collections: Record<string, CollectionDoc>
  globals: Record<string, TypeWithID>
}

export type GeneratedTypes<T extends BaseTypes> = {
  collections: {
    [P in keyof T['collections']]: CollectionDoc
  }
  globals: {
    [P in keyof T['globals']]: T['globals'][P]
  }
}

export type FetchOptions = {
  args?: Record<string, unknown>
  jwt?: string
  operation:
    | 'create'
    | 'delete'
    | 'find'
    | 'findVersions'
    | 'login'
    | 'sendEmail'
    | 'update'
    | 'updateGlobal'
  reduceJSON?: <R>(json: any) => R
}

type BaseArgs = {
  jwt?: string
}

export type CreateArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  collection: TSlug
  data: MarkOptional<
    TGeneratedTypes['collections'][TSlug],
    'createdAt' | 'id' | 'sizes' | 'updatedAt'
  >
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  file?: File
  filePath?: string
  locale?: string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  showHiddenFields?: boolean
  user?: TypeWithID
} & BaseArgs

export type UpdateByIDArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  id: number | string
  where?: never
} & UpdateBaseArgs<TGeneratedTypes, TSlug>

export type UpdateManyArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  id: never
  where?: Where
} & UpdateBaseArgs<TGeneratedTypes, TSlug>

export type UpdateBaseArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  autosave?: boolean
  collection: TSlug
  data: DeepPartial<TGeneratedTypes['collections'][TSlug]>
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  file?: File
  filePath?: string
  locale?: string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  showHiddenFields?: boolean
  user?: TypeWithID
} & BaseArgs

export type UpdateArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = UpdateByIDArgs<TGeneratedTypes, TSlug> | UpdateManyArgs<TGeneratedTypes, TSlug>

export type UpdateGlobalArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['globals'],
> = {
  data: DeepPartial<TGeneratedTypes['globals'][TSlug]>
  slug: TSlug
} & BaseArgs

export type FindArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  collection: TSlug
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  showHiddenFields?: boolean
  sort?: string
  user?: TypeWithID
  where?: Where
} & BaseArgs

export type LoginArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  collection: TSlug
  data: {
    email: string
    password: string
  }
} & BaseArgs

export type DeleteArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  collection: TSlug
  id?: string
  overrideAccess?: boolean
  where?: Where
} & BaseArgs
