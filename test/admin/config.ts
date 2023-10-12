import path from 'path'

import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { slateEditor } from '../../packages/richtext-slate/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import AfterDashboard from './components/AfterDashboard'
import AfterNavLinks from './components/AfterNavLinks'
import BeforeLogin from './components/BeforeLogin'
import CustomTabComponent from './components/CustomTabComponent'
import DemoUIFieldCell from './components/DemoUIField/Cell'
import DemoUIFieldField from './components/DemoUIField/Field'
import Logout from './components/Logout'
import CustomDefaultView from './components/views/CustomDefault'
import CustomDefaultEditView from './components/views/CustomDefaultEdit'
import CustomEditView from './components/views/CustomEdit'
import CustomMinimalRoute from './components/views/CustomMinimal'
import CustomVersionsView from './components/views/CustomVersions'
import CustomView from './components/views/CustomView'
import {
  globalSlug,
  group1Collection1Slug,
  group1Collection2Slug,
  postsSlug,
  slugPluralLabel,
  slugSingularLabel,
} from './shared'

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
      afterDashboard: [AfterDashboard],
      beforeLogin: [BeforeLogin],
      logout: {
        Button: Logout,
      },
      afterNavLinks: [AfterNavLinks],
      views: {
        // Dashboard: CustomDashboardView,
        // Account: CustomAccountView,
        CustomMinimalRoute: {
          path: '/custom-minimal-view',
          Component: CustomMinimalRoute,
        },
        CustomDefaultRoute: {
          path: '/custom-default-view',
          Component: CustomDefaultView,
        },
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
      slug: postsSlug,
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
          type: 'tabs',
          tabs: [
            {
              label: 'Tab 1',
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
                  editor: slateEditor({
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
              ],
            },
          ],
        },
        {
          name: 'sidebarField',
          type: 'text',
          admin: {
            position: 'sidebar',
            description:
              'This is a very long description that takes many characters to complete and hopefully will wrap instead of push the sidebar open, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum voluptates. Quisquam, voluptatum voluptates.',
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
              Default: CustomDefaultEditView,
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
      slug: group1Collection1Slug,
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
      slug: group1Collection2Slug,
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
      label: {
        en: 'My Global Label',
      },
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
              Default: CustomDefaultEditView,
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
      label: 'Group Globals 1',
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
        collection: postsSlug,
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
