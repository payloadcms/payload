/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import { payloadAdminSplatRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import { loadAdminPageRSC } from './server.functions.js'

export const Route = createFileRoute('/_payload/admin/$')({
  ...payloadAdminSplatRoute({ load: loadAdminPageRSC }),
  beforeLoad: async () => {
    await Promise.all([import('@payloadcms/ui/css/app.css'), import('./custom.css')])
  },
})
