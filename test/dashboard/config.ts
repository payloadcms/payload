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
          label: {
            en: 'Count Widget',
            es: 'Widget de Conteo',
          },
          maxWidth: 'medium',
          // fields: []
        },
        {
          slug: 'private',
          ComponentPath: './components/Private.tsx#default',
          label: 'Private Widget',
        },
        {
          slug: 'revenue',
          ComponentPath: './components/Revenue.tsx#default',
          // Demonstrates function form with i18n - returns localized label via t()
          label: ({ i18n }) => (i18n.language === 'es' ? 'Gráfico de Ingresos' : 'Revenue Chart'),
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
