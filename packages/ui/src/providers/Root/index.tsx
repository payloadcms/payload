'use client'
import type { I18nClient, I18nOptions, Language } from '@payloadcms/translations'
import type {
  ClientConfig,
  LanguageOptions,
  Locale,
  SanitizedPermissions,
  ServerFunctionClient,
  User,
} from 'payload'

import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import React, { Fragment } from 'react'

import type { Theme } from '../Theme/index.js'

import { LoadingOverlayProvider } from '../../elements/LoadingOverlay/index.js'
import { NavProvider } from '../../elements/Nav/context.js'
import { StayLoggedInModal } from '../../elements/StayLoggedIn/index.js'
import { StepNavProvider } from '../../elements/StepNav/index.js'
import { WindowInfoProvider } from '../../providers/WindowInfo/index.js'
import { AuthProvider } from '../Auth/index.js'
import { ClientFunctionProvider } from '../ClientFunction/index.js'
import { ConfigProvider } from '../Config/index.js'
import { DocumentEventsProvider } from '../DocumentEvents/index.js'
import { LocaleProvider } from '../Locale/index.js'
import { ParamsProvider } from '../Params/index.js'
import { PreferencesProvider } from '../Preferences/index.js'
import { RouteCache } from '../RouteCache/index.js'
import { RouteTransitionProvider } from '../RouteTransition/index.js'
import { SearchParamsProvider } from '../SearchParams/index.js'
import { ServerFunctionsProvider } from '../ServerFunctions/index.js'
import { ThemeProvider } from '../Theme/index.js'
import { ToastContainer } from '../ToastContainer/index.js'
import { TranslationProvider } from '../Translation/index.js'
import { UploadHandlersProvider } from '../UploadHandlers/index.js'

type Props = {
  readonly children: React.ReactNode
  readonly config: ClientConfig
  readonly dateFNSKey: Language['dateFNSKey']
  readonly fallbackLang: I18nOptions['fallbackLanguage']
  readonly isNavOpen?: boolean
  readonly languageCode: string
  readonly languageOptions: LanguageOptions
  readonly locale?: Locale['code']
  readonly permissions: SanitizedPermissions
  readonly serverFunction: ServerFunctionClient
  readonly switchLanguageServerAction?: (lang: string) => Promise<void>
  readonly theme: Theme
  readonly translations: I18nClient['translations']
  readonly user: null | User
}

export const RootProvider: React.FC<Props> = ({
  children,
  config,
  dateFNSKey,
  fallbackLang,
  isNavOpen,
  languageCode,
  languageOptions,
  locale,
  permissions,
  serverFunction,
  switchLanguageServerAction,
  theme,
  translations,
  user,
}) => {
  const RouteCacheComponent =
    process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true' ? RouteCache : Fragment

  return (
    <Fragment>
      <ServerFunctionsProvider serverFunction={serverFunction}>
        <RouteTransitionProvider>
          <RouteCacheComponent>
            <ConfigProvider config={config}>
              <ClientFunctionProvider>
                <TranslationProvider
                  dateFNSKey={dateFNSKey}
                  fallbackLang={fallbackLang}
                  language={languageCode}
                  languageOptions={languageOptions}
                  switchLanguageServerAction={switchLanguageServerAction}
                  translations={translations}
                >
                  <WindowInfoProvider
                    breakpoints={{
                      l: '(max-width: 1440px)',
                      m: '(max-width: 1024px)',
                      s: '(max-width: 768px)',
                      xs: '(max-width: 400px)',
                    }}
                  >
                    <ScrollInfoProvider>
                      <SearchParamsProvider>
                        <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
                          <AuthProvider permissions={permissions} user={user}>
                            <PreferencesProvider>
                              <ThemeProvider theme={theme}>
                                <ParamsProvider>
                                  <LocaleProvider locale={locale}>
                                    <StepNavProvider>
                                      <LoadingOverlayProvider>
                                        <DocumentEventsProvider>
                                          <NavProvider initialIsOpen={isNavOpen}>
                                            <UploadHandlersProvider>
                                              {children}
                                            </UploadHandlersProvider>
                                          </NavProvider>
                                        </DocumentEventsProvider>
                                      </LoadingOverlayProvider>
                                    </StepNavProvider>
                                  </LocaleProvider>
                                </ParamsProvider>
                              </ThemeProvider>
                            </PreferencesProvider>
                            <ModalContainer />
                            <StayLoggedInModal />
                          </AuthProvider>
                        </ModalProvider>
                      </SearchParamsProvider>
                    </ScrollInfoProvider>
                  </WindowInfoProvider>
                </TranslationProvider>
              </ClientFunctionProvider>
            </ConfigProvider>
          </RouteCacheComponent>
        </RouteTransitionProvider>
      </ServerFunctionsProvider>
      <ToastContainer />
    </Fragment>
  )
}
