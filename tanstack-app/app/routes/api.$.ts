import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
} from '@payloadcms/tanstack-start/routes'
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/api/$')({
  DELETE: ({ request }) => REST_DELETE(config)(request),
  GET: ({ request }) => REST_GET(config)(request),
  OPTIONS: ({ request }) => REST_OPTIONS(config)(request),
  PATCH: ({ request }) => REST_PATCH(config)(request),
  POST: ({ request }) => REST_POST(config)(request),
})
