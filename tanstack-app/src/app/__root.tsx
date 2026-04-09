import type { ServerFunctionClient } from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { TanStackRouterAdapter } from '@payloadcms/tanstack-start/client'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import '@payloadcms/ui/scss/app.scss'

import { getLayoutDataFn } from '../functions/layout.functions'

const serverFunctionHandler: ServerFunctionClient = createServerFn({ method: 'POST' })
  .inputValidator((data: any) => data)
  .handler(async ({ data }) => {
    const { handleServerFunctions, toSerializable } = await import(
      '@payloadcms/tanstack-start/server'
    )
    const config = (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')
    const result = await handleServerFunctions({ ...data, config, importMap })
    return toSerializable(result)
  }) as unknown as ServerFunctionClient

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
