/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import { payloadAdminIndexRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import { loadAdminPageRSC } from './server.functions.js'

export const Route = createFileRoute('/_payload/admin/')(
  payloadAdminIndexRoute({ load: loadAdminPageRSC }),
)
