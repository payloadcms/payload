import { fileURLToPath } from 'node:url'
import path from 'path'
import { type WidgetInstance } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Events } from './collections/Events.js'
import { Revenue } from './collections/Revenue.js'
import { Tickets } from './collections/Tickets.js'

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
            widgetSlug: 'collection-cards',
            width: 12,
            height: 3,
          },
          // Filter widget - allows users to set status/priority filters
          {
            widgetSlug: 'search-params-filter',
            width: 3,
            height: 2,
          },
          // Filtered count widgets - reactively updates with search params
          {
            widgetSlug: 'search-params-count-client',
            width: 3,
            height: 1,
          },
          {
            widgetSlug: 'search-params-count-client',
            width: 3,
            height: 1,
          },
          {
            widgetSlug: 'search-params-count',
            width: 3,
            height: 1,
            // NOTE - widget data does nothing here - need to set in the widget config itself)
            // widgetData: {
            //   collection: 'tickets',
            //   title: 'Filtered Count (server)',
            //   icon: '🎫',
            //   color: 'blue',
            //   filterFields: ['status', 'priority'],
            // },
          },
          // Regular count widgets (unfiltered)
          // ...Array.from(
          //   { length: 2 },
          //   (): WidgetInstance => ({
          //     widgetSlug: 'count',
          //     width: 3,
          //     height: 1,
          //   }),
          // ),
          {
            widgetSlug: 'revenue',
            width: 12,
            height: 2,
          },
        ]

        if (user?.email === 'dev@payloadcms.com') {
          baseWidgets.push({
            widgetSlug: 'private',
            width: 12,
            height: 1,
          })
        }
        return baseWidgets
      },
      widgets: [
        {
          slug: 'count',
          ComponentPath: './components/Count.tsx#default',
          maxWidth: 6,
          // fields: []
        },
        {
          slug: 'search-params-count',
          ComponentPath: './components/SearchParamsCount.tsx#default',
          maxWidth: 6,
          widgetData: {
            collection: 'tickets',
            title: 'Filtered Count  (server)',
            icon: '🎫',
            color: 'blue',
            filterFields: ['status', 'priority'],
          },
          // Dynamic count widget that filters based on URL search params (server component)
          // Configure via widgetData: { collection, title, icon, color, filterFields }
        },
        {
          slug: 'search-params-count-client',
          ComponentPath: './components/SearchParamsCountClientWrapper.tsx#default',
          maxWidth: 6,
          widgetData: {
            collection: 'tickets',
            title: 'Filtered Count (client)',
            icon: '🎫',
            color: 'blue',
            filterFields: ['status', 'priority'],
          },
          // Client-side version - reactively updates when search params change
          // Configure via widgetData: { collection, title, icon, color, filterFields }
        },
        {
          slug: 'search-params-filter',
          ComponentPath: './components/SearchParamsFilter.tsx#default',
          widgetData: {
            title: 'Ticket Filters',
          },
          maxWidth: 4,
          minWidth: 3,
          // Filter widget for manipulating URL search params
          // Configure via widgetData: { title, filters: [{ field, label, options }], showClearAll }
        },
        {
          slug: 'private',
          ComponentPath: './components/Private.tsx#default',
        },
        {
          slug: 'revenue',
          ComponentPath: './components/Revenue.tsx#default',
          minWidth: 6,
          maxHeight: 2,
          minHeight: 2,
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
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create some sample data
    try {
      // Create sample tickets
      for (let i = 1; i <= 35; i++) {
        await payload.create({
          collection: 'tickets',
          data: {
            title: `Support Ticket #${i}`,
            description: `Sample ticket description for ticket ${i}`,
            status: ['open', 'in-progress', 'closed'][Math.floor(Math.random() * 3)],
            priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          },
        })
      }

      // Create sample revenue entries
      const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
      for (const month of months) {
        for (let i = 1; i <= Math.floor(Math.random() * 10) + 5; i++) {
          await payload.create({
            collection: 'revenue',
            data: {
              amount: Math.floor(Math.random() * 10000) + 1000,
              description: `Revenue entry ${i} for ${month}`,
              date: `${month}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
              category: ['sales', 'subscriptions', 'services', 'other'][
                Math.floor(Math.random() * 4)
              ],
              source: 'Sample data',
            },
          })
        }
      }

      // Create sample events
      const currentDate = new Date()
      for (let i = 1; i <= 550; i++) {
        const eventDate = new Date(currentDate)
        eventDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 365) - 180) // Random date within ±6 months

        await payload.create({
          collection: 'events',
          data: {
            title: `Event ${i}`,
            description: `Sample event description for event ${i}`,
            startDate: eventDate.toISOString(),
            type: ['meeting', 'conference', 'workshop', 'webinar', 'other'][
              Math.floor(Math.random() * 5)
            ],
            status: ['scheduled', 'in-progress', 'completed', 'cancelled'][
              Math.floor(Math.random() * 4)
            ],
            location: `Location ${i}`,
          },
        })
      }
    } catch (err) {
      console.error('Error creating sample data:', err)
    }
  },
})
