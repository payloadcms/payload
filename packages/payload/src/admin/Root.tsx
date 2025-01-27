'use client'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { ScrollInfoProvider } from '@faceless-ui/scroll-info'
import { WindowInfoProvider } from '@faceless-ui/window-info'
// @ts-ignore - need to do this because this file doesn't actually exist
import config from 'payload-config'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'

import type { SanitizedConfig } from '../config/types'

import { NavProvider } from './components/elements/Nav/context'
import { StepNavProvider } from './components/elements/StepNav'
import { AuthProvider } from './components/utilities/Auth'
import { ConfigProvider } from './components/utilities/Config'
import { CustomProvider } from './components/utilities/CustomProvider'
import { DocumentEventsProvider } from './components/utilities/DocumentEvents'
import { I18n } from './components/utilities/I18n'
import { LanguageWrap } from './components/utilities/LanguageWrap'
import { LoadingOverlayProvider } from './components/utilities/LoadingOverlay'
import { LocaleProvider } from './components/utilities/Locale'
import { PreferencesProvider } from './components/utilities/Preferences'
import { SearchParamsProvider } from './components/utilities/SearchParams'
import { ThemeProvider } from './components/utilities/Theme'
import { Routes } from './components/views/Routes'
import './scss/app.scss'

const Root = ({ config: incomingConfig }: { config?: SanitizedConfig }) => {
  return (
    <React.Fragment>
      <ConfigProvider config={incomingConfig || config}>
        <I18n />
        <WindowInfoProvider
          breakpoints={{
            l: '(max-width: 1440px)',
            m: '(max-width: 1024px)',
            s: '(max-width: 768px)',
            xs: '(max-width: 400px)',
          }}
        >
          <ScrollInfoProvider>
            <Router>
              <ModalProvider classPrefix="payload" transTime={0} zIndex="var(--z-modal)">
                <AuthProvider>
                  <PreferencesProvider>
                    <ThemeProvider>
                      <LanguageWrap>
                        <SearchParamsProvider>
                          <LocaleProvider>
                            <StepNavProvider>
                              <LoadingOverlayProvider>
                                <DocumentEventsProvider>
                                  <NavProvider>
                                    <CustomProvider>
                                      <Routes />
                                    </CustomProvider>
                                  </NavProvider>
                                </DocumentEventsProvider>
                              </LoadingOverlayProvider>
                            </StepNavProvider>
                          </LocaleProvider>
                        </SearchParamsProvider>
                      </LanguageWrap>
                    </ThemeProvider>
                    <ModalContainer />
                  </PreferencesProvider>
                </AuthProvider>
              </ModalProvider>
            </Router>
          </ScrollInfoProvider>
        </WindowInfoProvider>
      </ConfigProvider>
      <ToastContainer icon={false} position="bottom-center" transition={Slide} />
    </React.Fragment>
  )
}

export default Root
