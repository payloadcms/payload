'use client'
import React, { Fragment } from 'react'
import { ClientConfig } from 'payload/types'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import { WindowInfoProvider } from '@faceless-ui/window-info'
import { ConfigProvider } from '../Config'
import { AuthProvider } from '../Auth'
import { PreferencesProvider } from '../Preferences'
import { ThemeProvider } from '../Theme'
import { LocaleProvider } from '../Locale'
import { StepNavProvider } from '../../elements/StepNav'
import { LoadingOverlayProvider } from '../../elements/LoadingOverlay'
import { NavProvider } from '../../elements/Nav/context'
import { ActionsProvider } from '../ActionsProvider'
import { TranslationProvider } from '../Translation'
import type { LanguageOptions, LanguageTranslations } from '../Translation'
import { Slide, ToastContainer } from 'react-toastify'
import { DocumentEventsProvider } from '../DocumentEvents'
import { CustomProvider } from '../CustomProvider'

type Props = {
  config: ClientConfig
  children: React.ReactNode
  translations: LanguageTranslations
  lang: string
  fallbackLang: ClientConfig['i18n']['fallbackLanguage']
  languageOptions: LanguageOptions
}

export const RootProvider: React.FC<Props> = ({
  config,
  translations,
  children,
  lang,
  fallbackLang,
  languageOptions,
}) => {
  return (
    <Fragment>
      <ConfigProvider config={config}>
        <TranslationProvider
          lang={lang}
          translations={translations}
          fallbackLang={fallbackLang}
          languageOptions={languageOptions}
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
              <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
                <AuthProvider>
                  <PreferencesProvider>
                    <ThemeProvider>
                      <LocaleProvider>
                        <StepNavProvider>
                          <LoadingOverlayProvider>
                            <DocumentEventsProvider>
                              <ActionsProvider>
                                <NavProvider>
                                  <CustomProvider>{children}</CustomProvider>
                                </NavProvider>
                              </ActionsProvider>
                            </DocumentEventsProvider>
                          </LoadingOverlayProvider>
                        </StepNavProvider>
                      </LocaleProvider>
                    </ThemeProvider>
                  </PreferencesProvider>
                  <ModalContainer />
                </AuthProvider>
              </ModalProvider>
            </ScrollInfoProvider>
          </WindowInfoProvider>
        </TranslationProvider>
      </ConfigProvider>
      {/* <ToastContainer icon={false} position="bottom-center" transition={Slide} /> */}
    </Fragment>
  )
}
