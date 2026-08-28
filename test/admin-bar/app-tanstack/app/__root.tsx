import { withPayloadRoot } from '@payloadcms/tanstack-start/client'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'

import { HydrationMarker } from '../components/HydrationMarker/index.js'

export const Route = createRootRoute({
  // Single Payload integration touch point: `withPayloadRoot` renders the
  // Payload admin document shell on `/admin` routes and our own shell
  // everywhere else. No root loader, no manual theme/html threading.
  shellComponent: withPayloadRoot(MarketingRoot),
})

function MarketingRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <HydrationMarker />
        <Scripts />
      </body>
    </html>
  )
}
