import type { ServerFunctionClient } from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { TanStackRouterAdapter } from '@payloadcms/tanstack-start/client'
import { getLayoutData } from '@payloadcms/tanstack-start/layouts'
import { handleServerFunctions } from '@payloadcms/tanstack-start/server'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import config from '@payload-config'

import { importMap } from '../importMap.js'

const getLayoutDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getLayoutData({ configPromise: config, importMap })
})

const serverFunctionHandler: ServerFunctionClient = async (args) => {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export const Route = createRootRoute({
  loader: () => getLayoutDataFn(),
  component: RootComponent,
})

function RootComponent() {
  const data = Route.useLoaderData()

  const dir = (rtlLanguages as unknown as string[]).includes(data.languageCode) ? 'RTL' : 'LTR'

  return (
    <html data-theme={data.theme} dir={dir} lang={data.languageCode} suppressHydrationWarning>
      <head>
        <HeadContent />
        <style>{`@layer payload-default, payload;`}</style>
      </head>
      <body>
        <RootProvider
          config={data.clientConfig}
          dateFNSKey={data.dateFNSKey}
          fallbackLang={data.fallbackLang}
          isNavOpen={data.isNavOpen}
          languageCode={data.languageCode}
          languageOptions={data.languageOptions}
          locale={data.locale}
          permissions={data.user ? data.permissions : null}
          RouterAdapter={TanStackRouterAdapter}
          serverFunction={serverFunctionHandler}
          switchLanguageServerAction={async () => {}}
          theme={data.theme}
          translations={data.translations}
          user={data.user}
        >
          <ProgressBar />
          <Outlet />
        </RootProvider>
        <div id="portal" />
        <Scripts />
      </body>
    </html>
  )
}
