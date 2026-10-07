import configPromise from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

const customAPIConfig = configPromise.then((config) => ({
  ...config,
  routes: {
    ...config.routes,
    api: '/custom-api',
  },
}))

export const GET = REST_GET(customAPIConfig)
export const POST = REST_POST(customAPIConfig)
export const DELETE = REST_DELETE(customAPIConfig)
export const PATCH = REST_PATCH(customAPIConfig)
export const PUT = REST_PUT(customAPIConfig)
export const OPTIONS = REST_OPTIONS(customAPIConfig)
