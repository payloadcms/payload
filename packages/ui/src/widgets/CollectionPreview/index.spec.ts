import type { SanitizedCollectionConfig, WidgetServerProps } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { CollectionPreviewWidget } from './index.js'

vi.mock('../../exports/client/index.js', () => ({ CollectionPreviewClient: () => null }))
vi.mock('./renderTable.js', () => ({
  renderCollectionPreviewTable: vi.fn(() => 'collection table'),
}))

function createProps({ canCreate = true, canRead = true, isHidden = false } = {}) {
  const collection = {
    slug: 'pages',
    admin: { hidden: isHidden, useAsTitle: 'title' },
    auth: false,
    fields: [],
    flattenedFields: [],
    labels: { plural: 'Pages' },
    timestamps: true,
    upload: false,
  }
  const find = vi.fn().mockResolvedValue({ docs: [{ id: 'page/1', title: 'Hello' }] })
  const req = {
    i18n: { language: 'en', t: (key: string) => key },
    payload: {
      collections: { pages: { config: collection } },
      config: { collections: [collection], globals: [], routes: { admin: '/cms' } },
      find,
      logger: { error: vi.fn() },
    },
    user: { id: 'user-1', collection: 'users' },
  }

  return {
    find,
    props: {
      permissions: { collections: { pages: { create: canCreate, read: canRead } } },
      req,
      widgetData: { relatedCollection: 'pages' },
    } as unknown as WidgetServerProps,
  }
}

describe('collection preview widget', () => {
  it('should fetch eight documents with the current user and access control enabled', async () => {
    const { find, props } = createProps()
    const result = await CollectionPreviewWidget(props)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        limit: 8,
        overrideAccess: false,
        req: props.req,
        user: props.req.user,
      }),
    )
    expect(result?.props.table).toBe('collection table')
    expect(result?.props.documents).toEqual([
      expect.objectContaining({
        href: '/cms/collections/pages/page%2F1',
        title: 'Hello',
      }),
    ])
  })

  it.each(['baseFilter', 'baseListFilter'] as const)(
    'should apply the selected tenant constraint from %s',
    async (filterName) => {
      const { find, props } = createProps()
      const where = { tenant: { equals: 'selected-tenant' } }
      const filter = vi.fn().mockResolvedValue(where)

      props.req.payload.collections.pages.config.admin[filterName] = filter

      await CollectionPreviewWidget(props)

      expect(filter).toHaveBeenCalledWith({
        limit: 8,
        locale: props.req.locale,
        page: 1,
        req: props.req,
        sort: '-updatedAt',
      })
      expect(find).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ collection: 'pages', overrideAccess: false, where }),
      )
    },
  )

  it('should prefer baseFilter even when it returns no constraint', async () => {
    const { find, props } = createProps()
    const legacyFilter = vi.fn().mockReturnValue({ tenant: { equals: 'legacy-tenant' } })

    props.req.payload.collections.pages.config.admin.baseFilter = () => null
    props.req.payload.collections.pages.config.admin.baseListFilter = legacyFilter

    await CollectionPreviewWidget(props)

    expect(legacyFilter).not.toHaveBeenCalled()
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ collection: 'pages', where: undefined }),
    )
  })

  it('should report filter failures without querying unfiltered documents', async () => {
    const { find, props } = createProps()

    props.req.payload.collections.pages.config.admin.baseFilter = vi
      .fn()
      .mockRejectedValue(new Error('Filter unavailable'))

    const result = await CollectionPreviewWidget(props)

    expect(result?.props.loadError).toBe('dashboard:widgetQueryError')
    expect(find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages' }))
  })

  it.each([{ canRead: false }, { isHidden: true }])(
    'should skip unavailable collections %j',
    async (options) => {
      const { find, props } = createProps(options)

      expect(await CollectionPreviewWidget(props)).toBeNull()
      expect(find).not.toHaveBeenCalled()
    },
  )

  it('should omit create actions without create permission', async () => {
    const { props } = createProps({ canCreate: false })
    const result = await CollectionPreviewWidget(props)

    expect(result?.props.createHref).toBeUndefined()
  })

  it.each([
    { upload: false, expected: false },
    { upload: { bulkUpload: true }, expected: true },
    { upload: { bulkUpload: false }, expected: false },
    { upload: { bulkUpload: true, hideFileInputOnCreate: true }, expected: false },
  ])('should respect the upload collection settings %j', async ({ upload, expected }) => {
    const { props } = createProps()
    props.req.payload.collections.pages.config.upload =
      upload as SanitizedCollectionConfig['upload']

    const result = await CollectionPreviewWidget(props)

    expect(result?.props.isBulkUploadEnabled).toBe(expected)
    expect(result?.props.createLabel).toBe(expected ? 'upload:addFiles' : 'general:createNewLabel')
  })

  it('should restore the user display preference with access control enabled', async () => {
    const { find, props } = createProps()
    find
      .mockResolvedValueOnce({ docs: [{ id: '1', title: 'Page' }] })
      .mockResolvedValueOnce({ docs: [{ value: { documentLayout: 'table' } }] })

    const result = await CollectionPreviewWidget(props)

    expect(result?.props.initialLayout).toBe('table')
    expect(find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'payload-preferences',
        overrideAccess: false,
        req: props.req,
        user: props.req.user,
        where: { key: { equals: 'dashboard-collection-layout-pages' } },
      }),
    )
  })

  it('should keep the widget available when the display preference cannot be loaded', async () => {
    const { find, props } = createProps()
    find
      .mockResolvedValueOnce({ docs: [{ id: '1', title: 'Page' }] })
      .mockRejectedValueOnce(new Error('Preference unavailable'))

    const result = await CollectionPreviewWidget(props)

    expect(result?.props.initialLayout).toBe('grid')
    expect(result?.props.documents).toHaveLength(1)
    expect(result?.props.loadError).toBeUndefined()
  })

  it('should report a query error instead of claiming the collection is empty', async () => {
    const { find, props } = createProps()
    find.mockRejectedValueOnce(new Error('Database unavailable'))

    const result = await CollectionPreviewWidget(props)

    expect(result?.props.loadError).toBe('dashboard:widgetQueryError')
    expect(props.req.payload.logger.error).toHaveBeenCalledOnce()
  })
})
