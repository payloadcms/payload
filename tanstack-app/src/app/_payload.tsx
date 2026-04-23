import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { TanStackRouterAdapter } from '@payloadcms/tanstack-start/client'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import '@payloadcms/ui/scss/app.scss'

import { getLayoutDataFn } from '../functions/layout.functions'
import { serverFunctionHandler } from '../functions/serverFunction.functions'

export const Route = createFileRoute('/_payload')({
  loader: () => getLayoutDataFn(),
  component: PayloadLayout,
})

function PayloadLayout() {
  const data = Route.useLoaderData()

  const dir = (rtlLanguages as unknown as string[]).includes(data.languageCode) ? 'RTL' : 'LTR'

  return (
    <>
      <style>{`@layer payload-default, payload;`}</style>
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
    </>
  )
}
