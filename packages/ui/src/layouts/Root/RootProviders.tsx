'use client'
import type { RouterAdapterComponent, ServerFunctionClient } from 'payload'

import { DndContext, pointerWithin } from '@dnd-kit/core'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import React from 'react'

import type { RootLayoutData } from './getRootLayoutData.js'

import { CloseModalOnRouteChange } from '../../elements/CloseModalOnRouteChange/index.js'
import { DrawerStackProvider } from '../../elements/Drawer/index.js'
import { LoadingOverlayProvider } from '../../elements/LoadingOverlay/index.js'
import { NavProvider } from '../../elements/Nav/context.js'
import { StayLoggedInModal } from '../../elements/StayLoggedIn/index.js'
import { StepNavProvider } from '../../elements/StepNav/index.js'
import { AuthProvider } from '../../providers/Auth/index.js'
import { ClickOutsideProvider } from '../../providers/ClickOutside/index.js'
import { ClientFunctionProvider } from '../../providers/ClientFunction/index.js'
import { ConfigProvider } from '../../providers/Config/index.js'
import { DocumentEventsProvider } from '../../providers/DocumentEvents/index.js'
import { EmbedProvider } from '../../providers/Embed/index.js'
import { HierarchyProvider } from '../../providers/Hierarchy/index.js'
import { LocaleProvider } from '../../providers/Locale/index.js'
import { ModalAccessibility } from '../../providers/ModalAccessibility/index.js'
import { PreferencesProvider } from '../../providers/Preferences/index.js'
import { RouteCache } from '../../providers/RouteCache/index.js'
import { RouteTransitionProvider } from '../../providers/RouteTransition/index.js'
import { ProgressBar } from '../../providers/RouteTransition/ProgressBar/index.js'
import { ServerFunctionsProvider } from '../../providers/ServerFunctions/index.js'
import { ThemeProvider } from '../../providers/Theme/index.js'
import { ToastContainer } from '../../providers/ToastContainer/index.js'
import { TranslationProvider } from '../../providers/Translation/index.js'
import { UploadHandlersProvider } from '../../providers/UploadHandlers/index.js'
import { WindowInfoProvider } from '../../providers/WindowInfo/index.js'

export type RootProviderProps = {
  readonly children: React.ReactNode
  readonly data: RootLayoutData
  readonly RouterAdapter: RouterAdapterComponent
  readonly serverFunction: ServerFunctionClient
}

export const RootProviders: React.FC<RootProviderProps> = ({
  children,
  data,
  RouterAdapter,
  serverFunction,
}) => {
  const {
    clientConfig: config,
    dateFNSKey,
    fallbackLang,
    highContrastMode,
    isEmbedded: embed,
    isNavOpen,
    languageCode,
    languageOptions,
    locale,
    permissions,
    theme,
    translations,
    user,
  } = data

  const dndContextID = React.useId()

  return (
    <>
      <ClickOutsideProvider>
        <RouteTransitionProvider>
          <RouterAdapter>
            <ServerFunctionsProvider serverFunction={serverFunction}>
              <RouteCache
                cachingEnabled={process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true'}
              >
                <ConfigProvider config={config}>
                  <ClientFunctionProvider>
                    <TranslationProvider
                      dateFNSKey={dateFNSKey}
                      fallbackLang={fallbackLang}
                      language={languageCode}
                      languageOptions={languageOptions}
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
                          <ModalProvider
                            classPrefix="payload"
                            transTime={0}
                            zIndex="var(--z-modal)"
                          >
                            <DrawerStackProvider>
                              <ModalAccessibility />
                              <CloseModalOnRouteChange />
                              <AuthProvider permissions={user ? permissions : null} user={user}>
                                <PreferencesProvider>
                                  <HierarchyProvider>
                                    <ThemeProvider
                                      highContrastMode={highContrastMode}
                                      theme={theme}
                                    >
                                      <EmbedProvider embed={embed}>
                                        <LocaleProvider locale={locale}>
                                          <StepNavProvider>
                                            <LoadingOverlayProvider>
                                              <DocumentEventsProvider>
                                                <NavProvider initialIsOpen={isNavOpen}>
                                                  <UploadHandlersProvider>
                                                    <DndContext
                                                      collisionDetection={pointerWithin}
                                                      // Provide stable ID to fix hydration issues: https://github.com/clauderic/dnd-kit/issues/926
                                                      id={dndContextID}
                                                    >
                                                      <ProgressBar />
                                                      {children}
                                                    </DndContext>
                                                  </UploadHandlersProvider>
                                                </NavProvider>
                                              </DocumentEventsProvider>
                                            </LoadingOverlayProvider>
                                          </StepNavProvider>
                                        </LocaleProvider>
                                      </EmbedProvider>
                                    </ThemeProvider>
                                  </HierarchyProvider>
                                </PreferencesProvider>
                                <ModalContainer />
                                <StayLoggedInModal />
                              </AuthProvider>
                              {/* AuthProvider can unmount its children during logout; keep pending toasts alive. */}
                              <ToastContainer config={config} />
                            </DrawerStackProvider>
                          </ModalProvider>
                        </ScrollInfoProvider>
                      </WindowInfoProvider>
                    </TranslationProvider>
                  </ClientFunctionProvider>
                </ConfigProvider>
              </RouteCache>
            </ServerFunctionsProvider>
          </RouterAdapter>
        </RouteTransitionProvider>
      </ClickOutsideProvider>
      <div id="portal" />
    </>
  )
}
