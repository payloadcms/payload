import { withPayloadRoot } from '@payloadcms/tanstack-start/client'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'

import { HydrationMarker } from '../components/HydrationMarker/index.js'

export const Route = createRootRoute({
  head: () => ({
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Roboto+Mono:wght@100..700&display=swap',
      },
    ],
  }),
  // Single Payload integration touch point: `withPayloadRoot` renders the
  // Payload admin document shell on `/admin` routes and our own shell
  // everywhere else. No root loader, no manual theme/html threading.
  shellComponent: withPayloadRoot(MarketingHtml),
})

function MarketingHtml({ children }: { children: React.ReactNode }) {
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
