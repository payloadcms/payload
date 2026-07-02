import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

export const config = {
  plugins: [
    multiTenantPlugin({
      collections: {
        posts: {},
      },
      i18n: {
        translations: {
          en: {
            'nav-tenantSelector-label': 'Filter by Site',
          },
        },
      },
    }),
  ],
}
