/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY it because it could be re-written at any time. */
import { access } from '@payloadcms/next/routes/[collection]/access'
import config from 'payload-config'

export const GET = (request, context) => access({ config, collection: context.params.collection })
