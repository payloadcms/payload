import type { WidgetInstance } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Events } from './collections/Events.js'
import { Revenue } from './collections/Revenue.js'
import { Tickets } from './collections/Tickets.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
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
            (_value, index): WidgetInstance<'count'> => ({
              data: {
                collection: index % 2 === 0 ? 'tickets' : 'events',
                title: index % 2 === 0 ? 'Tickets' : 'Events',
              },
              widgetSlug: 'count',
              width: 'x-small',
            }),
          ),
          {
            data: {
              timeframe: 'monthly',
              title: 'Revenue (Monthly)',
            },
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

        const collectionQueryWidgets: WidgetInstance[] = [
          {
            data: {
              limit: 3,
              relatedCollection: 'revenue',
              sortDirection: 'desc',
              sortField: 'amount',
              title: 'Top revenue entries',
            },
            widgetSlug: 'collection-query',
            width: 'medium',
          },
          {
            data: {
              limit: 25,
              relatedCollection: 'events',
              sortDirection: 'asc',
              sortField: 'startDate',
              title: 'Event timeline',
              where: {
                location: {
                  equals: 'Dashboard demo',
                },
              },
            },
            widgetSlug: 'collection-query',
            width: 'medium',
          },
          // These intentionally stale widget configs simulate persisted JSON after migrations.
          {
            data: {
              limit: 3,
              relatedCollection: 'archived-posts',
              sortDirection: 'desc',
              sortField: 'updatedAt',
              title: 'Missing collection',
            },
            widgetSlug: 'collection-query',
            width: 'x-small',
          } as unknown as WidgetInstance,
          {
            data: {
              limit: 3,
              relatedCollection: 'tickets',
              sortDirection: 'desc',
              sortField: 'assignee',
              title: 'Non-sortable sort field',
            },
            widgetSlug: 'collection-query',
            width: 'x-small',
          },
          {
            data: {
              limit: 3,
              relatedCollection: 'events',
              sortDirection: 'asc',
              sortField: 'startDate',
              title: 'Missing filter field',
              where: {
                visibility: {
                  equals: 'public',
                },
              },
            },
            widgetSlug: 'collection-query',
            width: 'x-small',
          },
          {
            data: {
              limit: 3,
              relatedCollection: 'revenue',
              sortDirection: 'desc',
              sortField: 'total',
              title: 'Multiple stale fields',
              where: {
                channel: {
                  equals: 'enterprise',
                },
              },
            },
            widgetSlug: 'collection-query',
            width: 'x-small',
          },
        ]

        baseWidgets.push(...collectionQueryWidgets)

        return baseWidgets
      },
      widgets: [
        {
          slug: 'count',
          Component: './components/Count.tsx#default',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'collection',
              type: 'select',
              options: [
                {
                  label: 'Tickets',
                  value: 'tickets',
                },
                {
                  label: 'Events',
                  value: 'events',
                },
              ],
            },
          ],
          label: {
            en: 'Count Widget',
            es: 'Widget de Conteo',
          },
          maxWidth: 'medium',
        },
        {
          slug: 'private',
          Component: './components/Private.tsx#default',
          label: 'Private Widget',
        },
        {
          slug: 'revenue',
          Component: './components/Revenue.tsx#default',
          // Demonstrates function form with i18n - returns localized label via t()
          label: ({ i18n }) => (i18n.language === 'es' ? 'Gráfico de Ingresos' : 'Revenue Chart'),
          minWidth: 'medium',
        },
        {
          slug: 'page-query',
          Component: './components/PageQuery.tsx#default',
          label: 'Page Query Widget',
        },
        {
          slug: 'configurable',
          Component: './components/Configurable.tsx#default',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
              validate: (value) => {
                if (value && value.length < 10) {
                  return 'Description must be at least 10 characters'
                }
                return true
              },
            },
            {
              name: 'relatedTicket',
              type: 'relationship',
              relationTo: 'tickets',
            },
            {
              name: 'nestedGroup',
              type: 'group',
              fields: [
                {
                  name: 'nestedText',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
          label: 'Configurable Widget',
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
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
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await seed(payload)
  },
})
