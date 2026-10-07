import type { Payload } from 'payload'

import { renderDocumentSlots } from '@payloadcms/ui/views/Document/renderDocumentSlots'
import { createPayloadRequest, getAccessResults } from 'payload'
import { instructionsCollectionSlug } from 'payload/shared'
import { expect, onTestFinished } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Rebuild access for this test's temporary config.
import { getInstructionsCollection } from '../../packages/payload/src/llm-instructions/getInstructionsCollection.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal permission lookup without adding a public export for tests.
import { filterLLMInstructionsMenuItems } from '../../packages/ui/src/utilities/filterLLMInstructionsMenuItems.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal slot builder without adding a public export for tests.
import { renderListViewSlots } from '../../packages/ui/src/views/List/renderListViewSlots.js'
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'

test.suite('LLM instructions menu slots', { config: './config.ts' }, () => {
  test('should omit empty list and global menus for users who cannot manage instructions', async ({
    payload,
  }) => {
    const viewer = await payload.create({
      collection: 'users',
      data: { email: 'viewer@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const slots = await renderSlots({ payload, user: { ...viewer, collection: 'users' } })

    expect(slots.list.listMenuItems).toBeUndefined()
    expect(slots.document.EditMenuItems).toBeUndefined()
  })

  test('should include instruction menus for users who can manage the target', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const slots = await renderSlots({ payload, user })

    expect(slots.list.listMenuItems).toHaveLength(1)
    expect(slots.document.EditMenuItems).toHaveLength(1)
  })

  test('should only include instruction menus for records matching conditional update access', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const originalOptions = payload.config.llmInstructions
    const collectionConfig = payload.collections[instructionsCollectionSlug].config
    const originalUpdate = collectionConfig.access.update

    onTestFinished(() => {
      payload.config.llmInstructions = originalOptions
      collectionConfig.access.update = originalUpdate
    })
    payload.config.llmInstructions = {
      ...originalOptions,
      access: () => ({ id: { equals: 'collection-pages' } }),
    }
    collectionConfig.access.update = getInstructionsCollection({
      config: payload.config,
    }).access!.update!

    const slots = await renderSlots({ payload, user })

    expect(slots.list.listMenuItems).toHaveLength(1)
    expect(slots.document.EditMenuItems).toBeUndefined()
  })

  test('should preserve the request query when checking instruction menu access', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const req = await createPayloadRequest({
      payload,
      req: { query: { depth: 1, limit: 10 } },
      user,
    })
    const menuItems = await filterLLMInstructionsMenuItems({
      collectionSlug: 'pages',
      menuItems: ['@payloadcms/ui#LLMInstructionsMenuItem'],
      permissions: await getAccessResults({ req }),
      req,
    })

    expect(menuItems).toEqual(['@payloadcms/ui#LLMInstructionsMenuItem'])
    expect(req.query).toEqual({ depth: 1, limit: 10 })
  })

  test('should preserve custom menu items when the instructions item is denied', async ({
    payload,
  }) => {
    const viewer = await payload.create({
      collection: 'users',
      data: { email: 'viewer@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const slots = await renderSlots({
      hasCustomItem: true,
      payload,
      user: { ...viewer, collection: 'users' },
    })

    expect(slots.list.listMenuItems).toHaveLength(1)
    expect(slots.document.EditMenuItems).toHaveLength(1)
  })
})

const renderSlots = async ({
  hasCustomItem = false,
  payload,
  user,
}: {
  hasCustomItem?: boolean
  payload: Payload
  user: Parameters<typeof createPayloadRequest>[0]['user']
}) => {
  const req = await createPayloadRequest({ payload, user })
  const permissions = await getAccessResults({ req })
  const collectionConfig = payload.collections.pages.config
  const globalConfig = payload.config.globals.find(({ slug }) => slug === 'site-settings')!
  const customItems = hasCustomItem ? ['test#MenuItem'] : []
  const locale = { code: 'en', label: 'English' }
  const originalImportMap = payload.importMap

  onTestFinished(() => {
    payload.importMap = originalImportMap
  })
  payload.importMap = {
    ...originalImportMap,
    '@payloadcms/ui#LLMInstructionsMenuItem': () => null,
    'test#MenuItem': () => null,
  }

  return {
    list: await renderListViewSlots({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        hasCreatePermission: true,
        newDocumentURL: '/admin/collections/pages/create',
        viewType: 'list',
      },
      collectionConfig: {
        ...collectionConfig,
        admin: {
          ...collectionConfig.admin,
          components: {
            ...collectionConfig.admin.components,
            listMenuItems: [
              ...(collectionConfig.admin.components?.listMenuItems ?? []),
              ...customItems,
            ],
          },
        },
      },
      payload,
      req,
      serverProps: {
        collectionConfig,
        data: {},
        i18n: req.i18n,
        limit: 10,
        listPreferences: {},
        listSearchableFields: collectionConfig.admin.listSearchableFields,
        locale,
        payload,
        permissions,
        server: req.server!,
        user,
      },
    }),
    document: await renderDocumentSlots({
      globalConfig: {
        ...globalConfig,
        admin: {
          ...globalConfig.admin,
          components: {
            ...globalConfig.admin.components,
            edit: {
              ...globalConfig.admin.components?.edit,
              editMenuItems: [
                ...(globalConfig.admin.components?.edit?.editMenuItems ?? []),
                ...customItems,
              ],
            },
          },
        },
      },
      hasSavePermission: true,
      locale,
      permissions,
      req,
      user,
    }),
  }
}
