import type { PayloadRequest } from 'payload'

import { expect, it } from 'vitest'

import { getItemsFromConfig } from './getItemsFromConfig.js'

it('should include nested control defaults when restoring the configured layout', async () => {
  const items = await getItemsFromConfig(
    [{ widgetSlug: 'count', width: 'medium' }],
    {} as PayloadRequest,
    [
      {
        slug: 'count',
        controls: [
          {
            type: 'popout',
            label: 'Options',
            controls: [
              {
                type: 'group',
                controls: [
                  { type: 'switch', name: 'visible', defaultValue: true },
                  { type: 'number', name: 'limit', defaultValue: 0, step: 5 },
                ],
              },
            ],
          },
        ],
      },
    ],
  )

  expect(items[0].data).toEqual({ visible: true, limit: 0 })
})
