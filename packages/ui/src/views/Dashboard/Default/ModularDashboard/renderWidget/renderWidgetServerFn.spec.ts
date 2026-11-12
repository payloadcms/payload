import { expect, it, vi } from 'vitest'

import { RenderServerComponent } from '../../../../../elements/RenderServerComponent/index.js'
import { renderWidgetHandler } from './renderWidgetServerFn.js'

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
