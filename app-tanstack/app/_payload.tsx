import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { TanStackRouterAdapter } from '@payloadcms/tanstack-start/client'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import '@payloadcms/ui/scss/app.scss'
// Custom admin styles for this test app — mirrors the Next test app's
// `(payload)/custom.scss` so the shared "custom CSS" e2e passes on both adapters.
import './custom.scss'

import { HydrationMarker } from '../components/HydrationMarker/index.js'
import { getLayoutDataFn } from './_payload/layout.functions.js'
import { serverFunctionHandler } from './_payload/serverFunction.functions.js'
import { switchLanguageFn } from './_payload/switchLanguage.functions.js'

export const Route = createFileRoute('/_payload')({
  loader: () => getLayoutDataFn(),
  component: PayloadLayout,
})

function PayloadLayout() {
  const data = Route.useLoaderData()

  return (
    <>
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
        switchLanguageServerAction={async (lang: string) => {
          await switchLanguageFn({ data: lang })
        }}
        theme={data.theme}
        translations={data.translations}
        user={data.user}
      >
        <ProgressBar />
        {/* `data.providers` is the custom-provider tree (config.admin.components.providers)
            already wrapping the router <Outlet />; falls back to a bare <Outlet /> when
            no custom providers are configured. */}
        {(data as any).providers ?? <Outlet />}
      </RootProvider>
      <HydrationMarker />
      <div id="portal" />
    </>
  )
}
