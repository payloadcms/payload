import { beforeEach, expect, it, vi } from 'vitest'

import { RenderServerComponent } from '../../../../../elements/RenderServerComponent/index.js'
import { renderWidgetHandler } from './renderWidgetServerFn.js'

beforeEach(() => vi.clearAllMocks())

vi.mock('../../../../../elements/RenderServerComponent/index.js', () => ({
  RenderServerComponent: vi.fn(() => null),
}))

it('should retain toolbar values when resolving localized drawer fields for a widget', async () => {
  await renderWidgetHandler({
    req: {
      locale: 'es',
      user: { id: 'user-1' },
      payload: {
        config: {
          admin: {
            dashboard: {
              widgets: [
                {
                  slug: 'sales',
                  Component: './Sales.js',
                  fields: [{ name: 'title', type: 'text', localized: true }],
                  controls: [
                    {
                      name: 'timeframe',
                      type: 'select',
                      options: ['monthly', 'weekly'],
                      defaultValue: 'monthly',
                    },
                  ],
                },
              ],
            },
          },
        },
        importMap: {},
      },
    },
    widgetSlug: 'sales',
    widgetData: {
      title: { en: 'Sales', es: 'Ventas' },
      timeframe: 'weekly',
      unconfigured: 'ignored',
    },
  } as unknown as Parameters<typeof renderWidgetHandler>[0])

  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      serverProps: expect.objectContaining({
        widgetData: { title: 'Ventas', timeframe: 'weekly' },
      }),
    }),
  )
})

function getPreviewArgs({
  preview,
  isPreview = true,
}: {
  preview?: false | { Component?: string; data?: Record<string, unknown> }
  isPreview?: boolean
} = {}) {
  return {
    req: {
      locale: 'es',
      user: { id: 'user-1' },
      payload: {
        config: {
          admin: {
            dashboard: {
              widgets: [
                {
                  slug: 'sales',
                  Component: './Sales.js',
                  preview,
                  controls: [
                    {
                      name: 'timeframe',
                      type: 'select',
                      defaultValue: 'monthly',
                      options: ['monthly'],
                    },
                  ],
                  fields: [{ name: 'title', type: 'text', localized: true }],
                },
              ],
            },
          },
        },
        importMap: {},
        logger: { error: vi.fn() },
      },
    },
    isPreview,
    widgetId: 'picker-sales',
    widgetSlug: 'sales',
    widgetData: { title: { es: 'User data' }, timeframe: 'untrusted' },
  } as unknown as Parameters<typeof renderWidgetHandler>[0]
}

it('should preview the real component with default control values and no client-provided data', async () => {
  await renderWidgetHandler(getPreviewArgs())

  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      Component: './Sales.js',
      serverProps: expect.objectContaining({
        isPreview: true,
        widgetData: { timeframe: 'monthly' },
      }),
      clientProps: {
        isPreview: true,
        widgetData: { timeframe: 'monthly' },
        widgetId: 'picker-sales',
        widgetSlug: 'sales',
      },
    }),
  )
})

it('should render a custom preview component with localized sample data', async () => {
  await renderWidgetHandler(
    getPreviewArgs({
      preview: {
        Component: './SalesPreview.js',
        data: { title: { en: 'Sample sales', es: 'Ventas de ejemplo' }, count: 42 },
      },
    }),
  )

  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      Component: './SalesPreview.js',
      serverProps: expect.objectContaining({
        widgetData: { title: 'Ventas de ejemplo', count: 42, timeframe: 'monthly' },
      }),
    }),
  )
})

it('should not render a widget that opts out of previews', async () => {
  expect(await renderWidgetHandler(getPreviewArgs({ preview: false }))).toEqual({ component: null })
  expect(RenderServerComponent).not.toHaveBeenCalled()
})

it('should leave real widget rendering independent of preview settings', async () => {
  await renderWidgetHandler(
    getPreviewArgs({
      isPreview: false,
      preview: { Component: './Preview.js', data: { title: { es: 'Sample' } } },
    }),
  )

  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      Component: './Sales.js',
      serverProps: expect.objectContaining({
        widgetData: { title: 'User data', timeframe: 'untrusted' },
      }),
    }),
  )
  expect(vi.mocked(RenderServerComponent).mock.calls[0][0]).not.toHaveProperty('clientProps')
})

it('should require authentication for previews', async () => {
  const args = getPreviewArgs()

  args.req.user = null
  await expect(async () => renderWidgetHandler(args)).rejects.toThrow('Unauthorized')
  expect(RenderServerComponent).not.toHaveBeenCalled()
})

it('should fall back to a neutral thumbnail if preview rendering fails', async () => {
  vi.mocked(RenderServerComponent).mockImplementationOnce(() => {
    throw new Error('Preview failed')
  })

  expect(await renderWidgetHandler(getPreviewArgs())).toEqual({ component: null })
})

it('should include flat popout controls when rendering localized drawer fields', async () => {
  await renderWidgetHandler({
    req: {
      locale: 'es',
      user: { id: 'user-1' },
      payload: {
        config: {
          admin: {
            dashboard: {
              widgets: [
                {
                  slug: 'sales',
                  Component: './Sales',
                  fields: [{ type: 'text', name: 'title', localized: true }],
                  controls: [
                    {
                      type: 'popout',
                      label: 'Options',
                      controls: [
                        {
                          type: 'group',
                          controls: [
                            { type: 'switch', name: 'showTrend', defaultValue: true },
                            { type: 'number', name: 'limit', defaultValue: 5 },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        importMap: {},
      },
    },
    widgetSlug: 'sales',
    widgetData: { title: { en: 'Sales', es: 'Ventas' }, showTrend: false },
  } as unknown as Parameters<typeof renderWidgetHandler>[0])

  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      serverProps: expect.objectContaining({
        widgetData: { title: 'Ventas', showTrend: false, limit: 5 },
      }),
    }),
  )
})
