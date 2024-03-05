'use client'
import type { LanguageTranslations } from '@payloadcms/translations'
import type { ClientConfig } from 'payload/types'

import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import { WindowInfoProvider } from '@faceless-ui/window-info'
import React, { Fragment } from 'react'
import { Slide, ToastContainer } from 'react-toastify'

import type { ComponentMap } from '../../utilities/buildComponentMap/types'
import type { LanguageOptions } from '../Translation'

import { LoadingOverlayProvider } from '../../elements/LoadingOverlay'
import { NavProvider } from '../../elements/Nav/context'
import { StepNavProvider } from '../../elements/StepNav'
import { ActionsProvider } from '../ActionsProvider'
import { AuthProvider } from '../Auth'
import { ClientFunctionProvider } from '../ClientFunction'
import { ComponentMapProvider } from '../ComponentMapProvider'
import { ConfigProvider } from '../Config'
import { CustomProvider } from '../CustomProvider'
import { DocumentEventsProvider } from '../DocumentEvents'
import { DocumentInfoProvider } from '../DocumentInfo'
import { LocaleProvider } from '../Locale'
import { ParamsProvider } from '../Params'
import { PreferencesProvider } from '../Preferences'
import { SearchParamsProvider } from '../SearchParams'
import { ThemeProvider } from '../Theme'
import { TranslationProvider } from '../Translation'

type Props = {
  children: React.ReactNode
  componentMap: ComponentMap
  config: ClientConfig
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  lang: string
  languageOptions: LanguageOptions
  translations: LanguageTranslations
}

export const RootProvider: React.FC<Props> = ({
  children,
  componentMap,
  config,
  fallbackLang,
  lang,
  languageOptions,
  translations,
}) => {
  return (
    <Fragment>
      <ConfigProvider config={config}>
        <ComponentMapProvider componentMap={componentMap}>
          <ClientFunctionProvider>
            <TranslationProvider
              fallbackLang={fallbackLang}
              lang={lang}
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
                  <SearchParamsProvider>
                    <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
                      <AuthProvider>
                        <PreferencesProvider>
                          <ThemeProvider>
                            <ParamsProvider>
                              <LocaleProvider>
                                <StepNavProvider>
                                  <LoadingOverlayProvider>
                                    <DocumentInfoProvider>
                                      <DocumentEventsProvider>
                                        <ActionsProvider>
                                          <NavProvider>
                                            <CustomProvider>{children}</CustomProvider>
                                          </NavProvider>
                                        </ActionsProvider>
                                      </DocumentEventsProvider>
                                    </DocumentInfoProvider>
                                  </LoadingOverlayProvider>
                                </StepNavProvider>
                              </LocaleProvider>
                            </ParamsProvider>
                          </ThemeProvider>
                        </PreferencesProvider>
                        <ModalContainer />
                      </AuthProvider>
                    </ModalProvider>
                  </SearchParamsProvider>
                </ScrollInfoProvider>
              </WindowInfoProvider>
            </TranslationProvider>
          </ClientFunctionProvider>
        </ComponentMapProvider>
      </ConfigProvider>
      <ToastContainer icon={false} position="bottom-center" transition={Slide} />
    </Fragment>
  )
}
