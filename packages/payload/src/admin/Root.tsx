'use client';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
import config from 'payload-config';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
import { ModalProvider, ModalContainer } from '@faceless-ui/modal';
import { ToastContainer, Slide } from 'react-toastify';
import { AuthProvider } from './components/utilities/Auth/index.js';
import { ConfigProvider } from './components/utilities/Config/index.js';
import { PreferencesProvider } from './components/utilities/Preferences/index.js';
import { CustomProvider } from './components/utilities/CustomProvider/index.js';
import { SearchParamsProvider } from './components/utilities/SearchParams/index.js';
import { LocaleProvider } from './components/utilities/Locale/index.js';
import Routes from './components/Routes.js';
import { StepNavProvider } from './components/elements/StepNav/index.js';
import { ThemeProvider } from './components/utilities/Theme/index.js';
import { I18n } from './components/utilities/I18n/index.js';
import { LoadingOverlayProvider } from './components/utilities/LoadingOverlay/index.js';

import './scss/app.scss';

const Root = () => (
  <React.Fragment>
    <ConfigProvider config={config}>
      <I18n />
      <WindowInfoProvider breakpoints={{
        xs: '(max-width: 400px)',
        s: '(max-width: 768px)',
        m: '(max-width: 1024px)',
        l: '(max-width: 1440px)',
      }}
      >
        <ScrollInfoProvider>
          <Router>
            <ModalProvider
              classPrefix="payload"
              zIndex="var(--z-modal)"
              transTime={0}
            >
              <AuthProvider>
                <PreferencesProvider>
                  <ThemeProvider>
                    <SearchParamsProvider>
                      <LocaleProvider>
                        <StepNavProvider>
                          <LoadingOverlayProvider>
                            <CustomProvider>
                              <Routes />
                            </CustomProvider>
                          </LoadingOverlayProvider>
                        </StepNavProvider>
                      </LocaleProvider>
                    </SearchParamsProvider>
                  </ThemeProvider>
                  <ModalContainer />
                </PreferencesProvider>
              </AuthProvider>
            </ModalProvider>
          </Router>
        </ScrollInfoProvider>
      </WindowInfoProvider>
    </ConfigProvider>
    <ToastContainer
      position="bottom-center"
      transition={Slide}
      icon={false}
    />
  </React.Fragment>
);

export default Root;
