import type { Page } from '@playwright/test'
import type { Config } from 'payload'

import type { PayloadAdmin } from './modelTypes.js'
import type { RuntimeAdminPageModel } from './runtimeTypes.js'

import { createCollectionModel } from './collection.js'

export type CreatePayloadAdminArgs<Model extends RuntimeAdminPageModel> = {
  model: Model
  page: Page
  routes?: Pick<NonNullable<Config['routes']>, 'admin'>
  serverURL: string
}

export const createPayloadAdmin = <Model extends RuntimeAdminPageModel>({
  model,
  page,
  routes,
  serverURL,
}: CreatePayloadAdminArgs<Model>): PayloadAdmin<Model> => {
  return {
    collection: (slug) => {
      const descriptor = model.collections[slug]

      if (!descriptor) {
        throw new Error(`Cannot create an Admin page model for unknown collection "${slug}".`)
      }

      return createCollectionModel<Model, typeof slug>({
        descriptor: descriptor as Model['collections'][typeof slug],
        model,
        page,
        root: page,
        routes,
        serverURL,
      })
    },
  }
}
