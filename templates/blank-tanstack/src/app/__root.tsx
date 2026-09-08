import { withPayloadRoot } from '@payloadcms/tanstack-start/client'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'

export const Route = createRootRoute({
  shellComponent: withPayloadRoot(FrontendRoot),
})

function FrontendRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
