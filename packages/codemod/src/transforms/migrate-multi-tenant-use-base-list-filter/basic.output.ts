import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

export const config = {
  plugins: [
    multiTenantPlugin({
      collections: {
        posts: {
          useBaseFilter: false,
        },
        pages: {
          useBaseFilter: true,
          useTenantAccess: false,
        },
      },
    }),
  ],
}
