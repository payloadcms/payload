import type { Page } from '@playwright/test'

import type { LocatorRoot } from './fields/base.js'

export type RuntimeBlockDescriptor = {
  readonly fields: RuntimeFieldsDescriptor
  readonly label: string
  readonly slug: string
}

export type RuntimeFieldDescriptor = {
  readonly blocks?: Readonly<Record<string, RuntimeBlockDescriptor>>
  readonly fields?: RuntimeFieldsDescriptor
  readonly hasMany?: boolean
  readonly path: string
  readonly relationTo?: readonly string[]
  readonly type: string
}

export type RuntimeFieldsDescriptor = Readonly<Record<string, RuntimeFieldDescriptor>>

export type RuntimeCollectionDescriptor = {
  readonly fields: RuntimeFieldsDescriptor
  readonly slug: string
}

export type RuntimeAdminPageModel = {
  readonly collections: Readonly<Record<string, RuntimeCollectionDescriptor>>
}

export type FieldsModelContext = {
  collectionSlug: string
  instanceParentPath?: string
  model: RuntimeAdminPageModel
  page: Page
  root: LocatorRoot
  routes?: {
    admin?: string
  }
  schemaParentPath?: string
  scope: string
  serverURL: string
}

export type CreateFieldsModel = (
  fields: RuntimeFieldsDescriptor,
  context: FieldsModelContext,
) => Record<string, unknown>
