import { fileURLToPath } from 'node:url'
import path from 'path'
import { type WidgetInstance } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Events } from './collections/Events.js'
import { Revenue } from './collections/Revenue.js'
import { Tickets } from './collections/Tickets.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterDashboard: ['./components/BeforeOrAfterDashboard.js'],
      beforeDashboard: ['./components/BeforeOrAfterDashboard.js'],
      // views: {
      //   dashboard: {
      //     Component: {
      //       path: './components/Revenue.tsx#default',
      //     },
      //   },
      // },
    },
    dashboard: {
      defaultLayout: ({ req: { user } }) => {
        const baseWidgets: WidgetInstance[] = [
          {
            widgetSlug: 'collections',
            width: 'full',
          },
          ...Array.from(
            { length: 4 },
            (): WidgetInstance => ({
              widgetSlug: 'count',
              width: 'x-small',
            }),
          ),
          {
            widgetSlug: 'revenue',
            width: 'full',
          },
        ]

        if (user?.email === 'dev@payloadcms.com') {
          baseWidgets.push({
            widgetSlug: 'private',
            width: 'full',
          })
        }
        return baseWidgets
      },
      widgets: [
        {
          slug: 'count',
          ComponentPath: './components/Count.tsx#default',
          maxWidth: 'medium',
          // fields: []
        },
        {
          slug: 'private',
          ComponentPath: './components/Private.tsx#default',
        },
        {
          slug: 'revenue',
          ComponentPath: './components/Revenue.tsx#default',
          minWidth: 'medium',
        },
      ],
    },
  },
  collections: [
    Tickets,
    Revenue,
    Events,
    // ...Array.from({ length: 35 }, () => ({
    //   slug: `collection-${Math.random().toString(36).substring(2, 15)}`,
    //   fields: [],
    // })),
  ],
  onInit: async (payload) => {
    await seed(payload)
  },
})
