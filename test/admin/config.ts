import path from 'path'

import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { createSlate } from '../../packages/richtext-slate/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import AfterDashboard from './components/AfterDashboard'
import AfterNavLinks from './components/AfterNavLinks'
import BeforeLogin from './components/BeforeLogin'
import CustomTabComponent from './components/CustomTabComponent'
import DemoUIFieldCell from './components/DemoUIField/Cell'
import DemoUIFieldField from './components/DemoUIField/Field'
import Logout from './components/Logout'
import CustomDefaultRoute from './components/routes/CustomDefault'
import CustomMinimalRoute from './components/routes/CustomMinimal'
import CustomDefaultView from './components/views/CustomDefault'
import CustomEditView from './components/views/CustomEdit'
import CustomVersionsView from './components/views/CustomVersions'
import CustomView from './components/views/CustomView'
import { globalSlug, slug, slugPluralLabel, slugSingularLabel } from './shared'

export interface Post {
  createdAt: Date
  description: string
  id: string
  title: string
  updatedAt: Date
}

export default buildConfigWithDefaults({
  admin: {
    css: path.resolve(__dirname, 'styles.scss'),
    components: {
      // providers: [CustomProvider, CustomProvider],
      routes: [
        {
          path: '/custom-minimal-route',
          Component: CustomMinimalRoute,
        },
        {
          path: '/custom-default-route',
          Component: CustomDefaultRoute,
        },
      ],
      afterDashboard: [AfterDashboard],
      beforeLogin: [BeforeLogin],
      logout: {
        Button: Logout,
      },
      afterNavLinks: [AfterNavLinks],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
      },
    },
  },
  i18n: {
    resources: {
      en: {
        general: {
          dashboard: 'Home',
        },
      },
    },
  },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [],
    },
    {
      slug: 'hidden-collection',
      admin: {
        hidden: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug,
      labels: {
        singular: slugSingularLabel,
        plural: slugPluralLabel,
      },
      admin: {
        description: 'Description',
        listSearchableFields: ['title', 'description', 'number'],
        group: 'One',
        useAsTitle: 'title',
        defaultColumns: ['id', 'number', 'title', 'description', 'demoUIField'],
        preview: () => 'https://payloadcms.com',
      },
      versions: {
        drafts: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        {
          name: 'richText',
          type: 'richText',
          editor: createSlate({
            admin: {
              elements: ['relationship'],
            },
          }),
        },
        {
          type: 'ui',
          name: 'demoUIField',
          label: 'Demo UI Field',
          admin: {
            components: {
              Field: DemoUIFieldField,
              Cell: DemoUIFieldCell,
            },
          },
        },
        {
          name: 'sidebarField',
          type: 'text',
          admin: {
            position: 'sidebar',
          },
        },
      ],
    },
    {
      slug: 'custom-views-one',
      versions: true,
      admin: {
        components: {
          views: {
            // This will override the entire Edit view including all nested views, i.e. `/edit/:id/*`
            // To override one specific nested view, use the nested view's slug as the key
            Edit: CustomEditView,
          },
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'custom-views-two',
      versions: true,
      admin: {
        components: {
          views: {
            Edit: {
              // This will override one specific nested view within the `/edit/:id` route, i.e. `/edit/:id/versions`
              Default: CustomDefaultView,
              Versions: CustomVersionsView,
              MyCustomView: {
                path: '/custom-tab-view',
                Component: CustomView,
                Tab: {
                  label: 'Custom',
                  href: '/custom-tab-view',
                },
              },
              MyCustomViewWithCustomTab: {
                path: '/custom-tab-component',
                Component: CustomView,
                Tab: CustomTabComponent,
              },
            },
          },
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-one-collection-ones',
      admin: {
        group: 'One',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-one-collection-twos',
      admin: {
        group: 'One',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-two-collection-ones',
      admin: {
        group: 'Two',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-two-collection-twos',
      admin: {
        group: 'Two',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'geo',
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
  ],
  globals: [
    {
      slug: 'hidden-global',
      admin: {
        hidden: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: globalSlug,
      admin: {
        group: 'Group',
      },
      versions: {
        drafts: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'sidebarField',
          type: 'text',
          admin: {
            position: 'sidebar',
          },
        },
      ],
    },

    {
      slug: 'custom-global-views-one',
      versions: true,
      admin: {
        components: {
          views: {
            Edit: CustomEditView,
          },
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'custom-global-views-two',
      versions: true,
      admin: {
        components: {
          views: {
            Edit: {
              Default: CustomDefaultView,
              Versions: CustomVersionsView,
              MyCustomView: {
                path: '/custom-tab-view',
                Component: CustomView,
                Tab: {
                  label: 'Custom',
                  href: '/custom-tab-view',
                },
              },
              MyCustomViewWithCustomTab: {
                path: '/custom-tab-component',
                Component: CustomView,
                Tab: CustomTabComponent,
              },
            },
          },
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-globals-one',
      admin: {
        group: 'Group',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: 'group-globals-two',
      admin: {
        group: 'Group',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await mapAsync([...Array(11)], async () => {
      await payload.create({
        collection: slug,
        data: {
          title: 'title',
          description: 'description',
        },
      })
    })

    await payload.create({
      collection: 'custom-views-one',
      data: {
        title: 'title',
      },
    })

    await payload.create({
      collection: 'custom-views-two',
      data: {
        title: 'title',
      },
    })

    await payload.create({
      collection: 'geo',
      data: {
        point: [7, -7],
      },
    })

    await payload.create({
      collection: 'geo',
      data: {
        point: [5, -5],
      },
    })
  },
})
