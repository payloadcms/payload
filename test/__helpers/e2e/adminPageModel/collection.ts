import type { Page } from '@playwright/test'
import type { Config } from 'payload'

import { expect } from '@playwright/test'
import { formatAdminURL } from 'payload/shared'

import type { LocatorRoot } from './fields/base.js'
import type { PayloadCollection } from './modelTypes.js'
import type {
  FieldsModelContext,
  RuntimeAdminPageModel,
  RuntimeCollectionDescriptor,
  RuntimeFieldDescriptor,
  RuntimeFieldsDescriptor,
} from './runtimeTypes.js'

import { createArrayFieldModel } from './fields/array.js'
import { createBaseFieldModel } from './fields/base.js'
import { createBlocksFieldModel } from './fields/blocks.js'
import { createRelationshipFieldModel } from './fields/relationship.js'
import { createHasManyTextFieldModel, createTextFieldModel } from './fields/text.js'
import { selectors } from './selectors.js'

type CreateCollectionModelArgs = {
  descriptor: RuntimeCollectionDescriptor
  model: RuntimeAdminPageModel
  page: Page
  root: LocatorRoot
  routes?: Pick<NonNullable<Config['routes']>, 'admin'>
  scope?: string
  serverURL: string
}

const createFieldsModel = (
  fields: RuntimeFieldsDescriptor,
  context: FieldsModelContext,
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, descriptor]) => {
      const { instanceParentPath, schemaParentPath } = context
      const pathSuffix = schemaParentPath
        ? descriptor.path.slice(schemaParentPath.length + 1)
        : descriptor.path
      const instancePath = instanceParentPath
        ? `${instanceParentPath}.${pathSuffix}`
        : descriptor.path
      const args = {
        collectionSlug: context.collectionSlug,
        instancePath,
        root: context.root,
        schemaPath: descriptor.path,
        scope: context.scope,
      }

      if (descriptor.type === 'text') {
        return [
          fieldName,
          descriptor.hasMany ? createHasManyTextFieldModel(args) : createTextFieldModel(args),
        ]
      }

      if (descriptor.type === 'array' && descriptor.fields) {
        return [
          fieldName,
          createArrayFieldModel({
            ...context,
            createFieldsModel,
            descriptor: descriptor as {
              fields: RuntimeFieldsDescriptor
            } & RuntimeFieldDescriptor,
            instancePath,
          }),
        ]
      }

      if (descriptor.type === 'blocks' && descriptor.blocks) {
        return [
          fieldName,
          createBlocksFieldModel({
            ...context,
            createFieldsModel,
            descriptor: descriptor as {
              blocks: NonNullable<RuntimeFieldDescriptor['blocks']>
            } & RuntimeFieldDescriptor,
            instancePath,
          }),
        ]
      }

      if (descriptor.type === 'relationship' && descriptor.relationTo) {
        return [
          fieldName,
          createRelationshipFieldModel({
            ...context,
            createCollectionModel: (targetDescriptor, drawerRoot) =>
              createCollectionModel({
                descriptor: targetDescriptor,
                model: context.model,
                page: context.page,
                root: drawerRoot,
                routes: context.routes,
                scope: 'document drawer',
                serverURL: context.serverURL,
              }),
            descriptor: descriptor as {
              relationTo: readonly string[]
            } & RuntimeFieldDescriptor,
            instancePath,
            model: context.model,
          }),
        ]
      }

      if (descriptor.type === 'group' && descriptor.fields) {
        const wrapperSelector = selectors.fieldWrapper(instancePath)
        return [
          fieldName,
          {
            ...createBaseFieldModel({ ...args, wrapperSelector }),
            fields: createFieldsModel(descriptor.fields, {
              ...context,
              instanceParentPath: instancePath,
              schemaParentPath: descriptor.path,
            }),
          },
        ]
      }

      const wrapperSelector = selectors.fieldWrapper(instancePath)
      return [fieldName, createBaseFieldModel({ ...args, wrapperSelector })]
    }),
  )
}

const createNavigationTarget = (page: Page, url: string) => ({
  goto: async () => {
    await page.goto(url)
  },
  url,
})

export const createCollectionModel = <
  Model extends CreateCollectionModelArgs['model'],
  Slug extends Extract<keyof Model['collections'], string>,
>({
  descriptor,
  model,
  page,
  root,
  routes,
  scope,
  serverURL,
}: {
  descriptor: Model['collections'][Slug]
  model: Model
} & CreateCollectionModelArgs): PayloadCollection<Model, Slug> => {
  const listURL = formatAdminURL({
    adminRoute: routes?.admin ?? '/admin',
    path: `/collections/${descriptor.slug}`,
    serverURL,
  })

  return {
    slug: descriptor.slug as Slug,
    close: () => root.locator('.drawer__close').click(),
    create: createNavigationTarget(page, `${listURL}/create`),
    document: (id) => createNavigationTarget(page, `${listURL}/${encodeURIComponent(String(id))}`),
    fields: createFieldsModel(descriptor.fields, {
      collectionSlug: descriptor.slug,
      model,
      page,
      root,
      routes,
      scope: scope ?? 'document page',
      serverURL,
    }),
    list: createNavigationTarget(page, listURL),
    save: async () => {
      const collectionAPIPath = `/api/${descriptor.slug}`
      const saveResponse = page.waitForResponse((response) => {
        const method = response.request().method()
        const pathname = new URL(response.url()).pathname

        return (
          (method === 'POST' || method === 'PATCH') &&
          (pathname === collectionAPIPath || pathname.startsWith(`${collectionAPIPath}/`))
        )
      })

      await root.locator('#action-save').click()
      await saveResponse
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    },
  } as PayloadCollection<Model, Slug>
}
