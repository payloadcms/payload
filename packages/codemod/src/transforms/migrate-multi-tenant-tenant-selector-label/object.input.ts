import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

export const config = {
  plugins: [
    multiTenantPlugin({
      collections: {
        posts: {},
      },
      tenantSelectorLabel: {
        en: 'Filter by Site',
        fr: 'Filtrer par site',
      },
    }),
  ],
}
