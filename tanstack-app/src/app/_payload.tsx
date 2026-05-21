import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import { TanStackRouterAdapter } from '@payloadcms/tanstack-start/client'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import '@payloadcms/ui/scss/app.scss'

import { getLayoutDataFn } from '../functions/layout.functions'
import { serverFunctionHandler } from '../functions/serverFunction.functions'
import { switchLanguageFn } from '../functions/switchLanguage.functions'

export const Route = createFileRoute('/_payload')({
  loader: () => getLayoutDataFn(),
  component: PayloadLayout,
})

function PayloadLayout() {
  const data = Route.useLoaderData()

  const dir = (rtlLanguages as unknown as string[]).includes(data.languageCode) ? 'rtl' : 'ltr'

  /**
   * Mirror what Next.js sets on the `<html>` element via the root layout
   * (`packages/next/src/layouts/Root/index.tsx`). TanStack Router owns the
   * `<html>` element from `__root.tsx`, which doesn't have access to the
   * admin layout data, so we sync the relevant attributes here. The
   * `ThemeProvider` later overrides `data-theme` based on the cookie /
   * `prefers-color-scheme`, but setting it here avoids a flash on the first
   * paint for users with a stable theme preference.
   */
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', data.theme)
    html.setAttribute('dir', dir)
    html.setAttribute('lang', data.languageCode)
  }, [data.languageCode, data.theme, dir])

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
        <Outlet />
      </RootProvider>
      <div id="portal" />
    </>
  )
}
