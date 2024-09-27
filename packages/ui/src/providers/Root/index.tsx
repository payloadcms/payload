'use client'
import type { I18nClient, Language } from '@payloadcms/translations'
import type { ClientConfig, LanguageOptions, PayloadServerAction, Permissions, User } from 'payload'

import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import React, { Fragment } from 'react'

import type { Theme } from '../Theme/index.js'

import { LoadingOverlayProvider } from '../../elements/LoadingOverlay/index.js'
import { NavProvider } from '../../elements/Nav/context.js'
import { StayLoggedInModal } from '../../elements/StayLoggedIn/index.js'
import { StepNavProvider } from '../../elements/StepNav/index.js'
import { fieldComponents } from '../../fields/index.js'
import { WindowInfoProvider } from '../../providers/WindowInfo/index.js'
import { ActionsProvider } from '../Actions/index.js'
import { AuthProvider } from '../Auth/index.js'
import { ClientFunctionProvider } from '../ClientFunction/index.js'
import { ConfigProvider } from '../Config/index.js'
import { DocumentEventsProvider } from '../DocumentEvents/index.js'
import { FieldComponentsProvider } from '../FieldComponents/index.js'
import { LocaleProvider } from '../Locale/index.js'
import { ParamsProvider } from '../Params/index.js'
import { PreferencesProvider } from '../Preferences/index.js'
import { RouteCache } from '../RouteCache/index.js'
import { SearchParamsProvider } from '../SearchParams/index.js'
import { ServerActions } from '../ServerActions/index.js'
import { ThemeProvider } from '../Theme/index.js'
import { ToastContainer } from '../ToastContainer/index.js'
import { TranslationProvider } from '../Translation/index.js'

type Props = {
  readonly children: React.ReactNode
  readonly config: ClientConfig
  readonly dateFNSKey: Language['dateFNSKey']
  readonly fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  readonly isNavOpen?: boolean
  readonly languageCode: string
  readonly languageOptions: LanguageOptions
  readonly payloadServerAction: PayloadServerAction
  readonly permissions: Permissions
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
  payloadServerAction,
  permissions,
  switchLanguageServerAction,
  theme,
  translations,
  user,
}) => {
  const RouteCacheComponent =
    process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true' ? RouteCache : Fragment

  return (
    <Fragment>
      <ServerActions payloadServerAction={payloadServerAction}>
        <RouteCacheComponent>
          <ConfigProvider config={config}>
            <FieldComponentsProvider fieldComponents={fieldComponents}>
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
                                  <LocaleProvider>
                                    <StepNavProvider>
                                      <LoadingOverlayProvider>
                                        <DocumentEventsProvider>
                                          <ActionsProvider>
                                            <NavProvider initialIsOpen={isNavOpen}>
                                              {children}
                                            </NavProvider>
                                          </ActionsProvider>
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
            </FieldComponentsProvider>
          </ConfigProvider>
        </RouteCacheComponent>
      </ServerActions>
      <ToastContainer />
    </Fragment>
  )
}
