import type { DashboardViewServerProps } from '../index.js'

import { expect, it, vi } from 'vitest'

import { RenderServerComponent } from '../../../../elements/RenderServerComponent/index.js'
import { ModularDashboard } from './index.js'

vi.mock('../../../../elements/RenderServerComponent/index.js', () => ({
  RenderServerComponent: vi.fn(() => null),
}))
vi.mock('../../../../exports/client/index.js', () => ({ ModularDashboardClient: () => null }))
vi.mock('./utils/getItemsFromPreferences.js', () => ({
  getItemsFromPreferences: async () => null,
}))

it('should render the dashboard with grouped toolbar controls and localized drawer fields', async () => {
  const user = { id: 'user-1', collection: 'users' }
  const payload = {
    importMap: {},
    config: {
      admin: {
        dashboard: {
          defaultLayout: [
            {
              widgetSlug: 'count',
              width: 'medium',
              data: { title: { en: 'Count', es: 'Conteo' } },
            },
          ],
          widgets: [
            {
              slug: 'count',
              Component: './Count',
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
                        {
                          type: 'number',
                          name: 'limit',
                          defaultValue: 5,
                          min: 0,
                          max: 15,
                          step: 5,
                          slider: { hints: [0, 5, 10, 15] },
                        },
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
  }

  const result = await ModularDashboard({
    payload,
    user,
    initPageResult: { req: { payload, user, locale: 'es', i18n: { language: 'es' } } },
  } as unknown as DashboardViewServerProps)

  expect(result).toBeDefined()
  expect(RenderServerComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      Component: './Count',
      serverProps: expect.objectContaining({
        widgetData: { title: 'Conteo', showTrend: true, limit: 5 },
      }),
    }),
  )
})
