/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import payloadStyles from '@payloadcms/ui/css/app.css?url'
import { payloadAdminIndexRoute } from '@payloadcms/tanstack-start/client'
import { createFileRoute } from '@tanstack/react-router'

import customStyles from './custom.css?url'
import { loadAdminPageRSC } from './server.functions.js'

const adminRoute = payloadAdminIndexRoute({ load: loadAdminPageRSC })

export const Route = createFileRoute('/_payload/admin/')({
  ...adminRoute,
  head: (context) => {
    const adminHead = adminRoute.head(context)

    return {
      ...adminHead,
      links: [
        ...adminHead.links,
        { rel: 'stylesheet', href: payloadStyles },
        { rel: 'stylesheet', href: customStyles },
      ],
    }
  },
})
