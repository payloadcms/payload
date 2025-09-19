// Minimal config for Storybook - using type assertion to bypass strict typing
const config = {
  admin: {
    user: 'users',
    autoRefresh: false,
    routes: {
      account: '/account',
      browseByFolder: '/browse-by-folder',
      createFirstUser: '/create-first-user',
      forgot: '/forgot',
      inactivity: '/logout-inactivity',
      login: '/login',
      logout: '/logout',
      reset: '/reset',
      unauthorized: '/unauthorized',
    },
  },
  blocks: [],
  blocksMap: {},
  collections: [
    {
      slug: 'posts',
      labels: {
        singular: 'Post',
        plural: 'Posts',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
        },
      ],
      admin: {
        useAsTitle: 'title',
      },
    },
    {
      slug: 'categories',
      labels: {
        singular: 'Category',
        plural: 'Categories',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        useAsTitle: 'name',
      },
    },
  ],
  globals: [],
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/graphql',
    graphQLPlayground: '/graphql-playground',
  },
  serverURL: 'http://localhost:3000',
  unauthenticated: false,
} as any

export default config
