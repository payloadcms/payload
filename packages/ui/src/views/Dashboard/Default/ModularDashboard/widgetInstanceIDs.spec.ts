import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RenderServerComponent } from '../../../../elements/RenderServerComponent/index.js'
import { ModularDashboard } from './index.js'
import { getDefaultLayoutHandler } from './renderWidget/getDefaultLayoutServerFn.js'
import { renderWidgetHandler } from './renderWidget/renderWidgetServerFn.js'
import { getItemsFromPreferences } from './utils/getItemsFromPreferences.js'

vi.mock('../../../../elements/RenderServerComponent/index.js', () => ({
  RenderServerComponent: vi.fn(() => null),
}))
vi.mock('../../../../exports/client/index.js', () => ({ ModularDashboardClient: () => null }))
vi.mock('./utils/getItemsFromPreferences.js', () => ({ getItemsFromPreferences: vi.fn() }))

const widgetData = { relatedCollection: 'pages' }
const req = {
  i18n: { language: 'en' },
  payload: {
    config: {
      admin: {
        dashboard: {
          defaultLayout: [
            { data: widgetData, widgetSlug: 'collection-preview' },
            { data: widgetData, widgetSlug: 'collection-preview' },
          ],
          widgets: [
            { slug: 'collection-preview', Component: '/CollectionPreview', label: 'Preview' },
          ],
        },
      },
    },
    importMap: {},
  },
  user: { id: 'user-1', collection: 'users' },
}

describe('dashboard widget instance IDs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should pass saved instance IDs when initially rendering the dashboard', async () => {
    vi.mocked(getItemsFromPreferences).mockResolvedValue([
      {
        id: 'collection-preview-first',
        data: widgetData,
        maxWidth: 'full',
        minWidth: 'x-small',
        width: 'full',
      },
      {
        id: 'collection-preview-second',
        data: widgetData,
        maxWidth: 'full',
        minWidth: 'x-small',
        width: 'full',
      },
    ])

    await ModularDashboard({
      initPageResult: { req },
      payload: req.payload,
      user: req.user,
    } as unknown as Parameters<typeof ModularDashboard>[0])

    expect(
      vi.mocked(RenderServerComponent).mock.calls.map(([{ serverProps }]) => serverProps),
    ).toEqual([
      expect.objectContaining({ widgetId: 'collection-preview-first', widgetData }),
      expect.objectContaining({ widgetId: 'collection-preview-second', widgetData }),
    ])
  })

  it('should pass default instance IDs when resetting the dashboard', async () => {
    await getDefaultLayoutHandler({
      req,
      user: req.user,
    } as unknown as Parameters<typeof getDefaultLayoutHandler>[0])

    expect(
      vi.mocked(RenderServerComponent).mock.calls.map(([{ serverProps }]) => serverProps),
    ).toEqual([
      expect.objectContaining({ widgetId: 'collection-preview-0', widgetData }),
      expect.objectContaining({ widgetId: 'collection-preview-1', widgetData }),
    ])
  })

  it('should retain the instance ID when rendering an added or edited widget', async () => {
    await renderWidgetHandler({
      req,
      user: req.user,
      widgetData,
      widgetId: 'collection-preview-first',
      widgetSlug: 'collection-preview',
    } as unknown as Parameters<typeof renderWidgetHandler>[0])

    expect(RenderServerComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        serverProps: expect.objectContaining({ widgetId: 'collection-preview-first', widgetData }),
      }),
    )
  })
})
