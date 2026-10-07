/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import '@payloadcms/ui/css/app.css'
import { payloadAdminIndexRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import './custom.css'
import { loadAdminPageRSC } from './server.functions.js'

export const Route = createFileRoute('/_payload/admin/')(
  payloadAdminIndexRoute({ load: loadAdminPageRSC }),
)
