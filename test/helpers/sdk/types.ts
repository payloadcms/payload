import type { TypeWithID, Where } from 'payload/types'
import type { MarkOptional } from 'ts-essentials'

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
  method: 'create' | 'delete' | 'find'
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

export type DeleteArgs<
  TGeneratedTypes extends GeneratedTypes<TGeneratedTypes>,
  TSlug extends keyof TGeneratedTypes['collections'],
> = {
  collection: TSlug
  id?: string
  overrideAccess?: boolean
  where?: Where
} & BaseArgs
