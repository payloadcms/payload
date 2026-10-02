import type { Locator } from '@playwright/test'

type AdminFieldDescriptorLike = {
  readonly path: string
  readonly type: string
}

type AdminFieldsDescriptorLike = Readonly<Record<string, AdminFieldDescriptorLike>>

type AdminCollectionDescriptorLike = {
  readonly fields: AdminFieldsDescriptorLike
  readonly slug: string
}

type AdminPageModelLike = {
  readonly collections: Readonly<Record<string, AdminCollectionDescriptorLike>>
}

type CollectionSlug<Model extends AdminPageModelLike> = Extract<keyof Model['collections'], string>

type FieldSelectors = {
  readonly wrapper: string
}

export type BaseFieldModel = {
  readonly cell: (rowIndex: number) => Locator
  readonly heading: Locator
  readonly selectors: FieldSelectors
  readonly wrapper: Locator
}

export type TextFieldModel = {
  readonly expectValue: (value: string) => Promise<void>
  readonly fill: (value: string) => Promise<void>
  readonly getValue: () => Promise<string>
  readonly input: Locator
  readonly inputID: string
  readonly selectors: {
    readonly input: string
  } & FieldSelectors
} & BaseFieldModel

export type HasManyTextValueModel = {
  readonly expectValue: (value: string) => Promise<void>
  readonly fill: (value: string) => Promise<void>
  readonly getValue: () => Promise<string>
  readonly wrapper: Locator
}

export type HasManyTextFieldModel = {
  readonly addValue: (value: string) => Promise<void>
  readonly expectValues: (values: readonly string[]) => Promise<void>
  readonly input: Locator
  readonly selectors: {
    readonly input: string
  } & FieldSelectors
  readonly value: (index: number) => Promise<HasManyTextValueModel>
} & BaseFieldModel

export type ArrayRowModel<
  Fields extends AdminFieldsDescriptorLike,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly fields: FieldsModel<Fields, Model>
  readonly wrapper: Locator
}

export type ArrayFieldModel<
  Fields extends AdminFieldsDescriptorLike,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly addRow: () => Promise<ArrayRowModel<Fields, Model>>
  readonly row: (index: number) => Promise<ArrayRowModel<Fields, Model>>
} & BaseFieldModel

type AdminBlockDescriptorLike = {
  readonly fields: AdminFieldsDescriptorLike
  readonly slug: string
}

export type BlockRowModel<
  Block extends AdminBlockDescriptorLike,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly fields: FieldsModel<Block['fields'], Model>
  readonly slug: Block['slug']
  readonly wrapper: Locator
}

export type BlocksFieldModel<
  Blocks extends Readonly<Record<string, AdminBlockDescriptorLike>>,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly addBlock: <Slug extends Extract<keyof Blocks, string>>(
    slug: Slug,
  ) => Promise<BlockRowModel<Blocks[Slug], Model>>
  readonly block: <Slug extends Extract<keyof Blocks, string>>(
    index: number,
    slug: Slug,
  ) => Promise<BlockRowModel<Blocks[Slug], Model>>
} & BaseFieldModel

export type GroupFieldModel<
  Fields extends AdminFieldsDescriptorLike,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly fields: FieldsModel<Fields, Model>
} & BaseFieldModel

type RelationshipTarget<Model extends AdminPageModelLike, Descriptor> = Descriptor extends {
  readonly relationTo: readonly (infer Target extends string)[]
}
  ? Extract<Target, CollectionSlug<Model>>
  : never

type RelationshipDrawerArguments<Descriptor, TargetSlug extends string> = Descriptor extends {
  readonly relationTo: readonly [string]
}
  ? [targetSlug?: TargetSlug]
  : [targetSlug: TargetSlug]

export type RelationshipFieldModel<Model extends AdminPageModelLike, Descriptor> = {
  readonly createInDrawer: <
    TargetSlug extends RelationshipTarget<Model, Descriptor> = RelationshipTarget<
      Model,
      Descriptor
    >,
  >(
    ...args: RelationshipDrawerArguments<Descriptor, TargetSlug>
  ) => Promise<PayloadCollection<Model, TargetSlug>>
} & BaseFieldModel

type FieldModel<Model extends AdminPageModelLike, Descriptor> = Descriptor extends {
  readonly hasMany: true
  readonly type: 'text'
}
  ? HasManyTextFieldModel
  : Descriptor extends { readonly type: 'text' }
    ? TextFieldModel
    : Descriptor extends {
          readonly fields: infer Fields extends AdminFieldsDescriptorLike
          readonly type: 'array'
        }
      ? ArrayFieldModel<Fields, Model>
      : Descriptor extends {
            readonly blocks: infer Blocks extends Readonly<Record<string, AdminBlockDescriptorLike>>
            readonly type: 'blocks'
          }
        ? BlocksFieldModel<Blocks, Model>
        : Descriptor extends {
              readonly fields: infer Fields extends AdminFieldsDescriptorLike
              readonly type: 'group'
            }
          ? GroupFieldModel<Fields, Model>
          : Descriptor extends { readonly type: 'relationship' }
            ? RelationshipFieldModel<Model, Descriptor>
            : BaseFieldModel

export type FieldsModel<
  Fields extends AdminFieldsDescriptorLike,
  Model extends AdminPageModelLike = AdminPageModelLike,
> = {
  readonly [FieldName in keyof Fields]: FieldModel<Model, Fields[FieldName]>
}

export type PayloadCollection<
  Model extends AdminPageModelLike,
  Slug extends CollectionSlug<Model>,
> = {
  readonly close: () => Promise<void>
  readonly create: {
    readonly goto: () => Promise<void>
    readonly url: string
  }
  readonly document: (id: number | string) => {
    readonly goto: () => Promise<void>
    readonly url: string
  }
  readonly fields: FieldsModel<Model['collections'][Slug]['fields'], Model>
  readonly list: {
    readonly goto: () => Promise<void>
    readonly url: string
  }
  readonly save: () => Promise<void>
  readonly slug: Slug
}

export type PayloadAdmin<Model extends AdminPageModelLike> = {
  readonly collection: <Slug extends CollectionSlug<Model>>(
    slug: Slug,
  ) => PayloadCollection<Model, Slug>
}
