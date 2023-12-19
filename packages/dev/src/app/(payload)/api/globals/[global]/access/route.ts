/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY it because it could be re-written at any time. */
import { access } from '@payloadcms/next/routes/globals/[global]/access'
import config from 'payload-config'

export const GET = (request, context) => access({ config, global: context.params.global })
