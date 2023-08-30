'use client';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { ModalContainer, ModalProvider } from '@faceless-ui/modal';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
// @ts-expect-error - need to do this because this file doesn't actually exist
import config from 'payload-config';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';

import Routes from './components/Routes.js';
import { StepNavProvider } from './components/elements/StepNav/index.js';
import { AuthProvider } from './components/utilities/Auth/index.js';
import { ConfigProvider } from './components/utilities/Config/index.js';
import { CustomProvider } from './components/utilities/CustomProvider/index.js';
import { I18n } from './components/utilities/I18n/index.js';
import { LoadingOverlayProvider } from './components/utilities/LoadingOverlay/index.js';
import { LocaleProvider } from './components/utilities/Locale/index.js';
import { PreferencesProvider } from './components/utilities/Preferences/index.js';
import { SearchParamsProvider } from './components/utilities/SearchParams/index.js';
import { ThemeProvider } from './components/utilities/Theme/index.js';
import './scss/app.scss';

const Root = () => (
  <React.Fragment>
    <ConfigProvider config={config}>
      <I18n />
      <WindowInfoProvider breakpoints={{
        l: '(max-width: 1440px)',
        m: '(max-width: 1024px)',
        s: '(max-width: 768px)',
        xs: '(max-width: 400px)',
      }}
      >
        <ScrollInfoProvider>
          <Router>
            <ModalProvider
              classPrefix="payload"
              transTime={0}
              zIndex="var(--z-modal)"
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
      icon={false}
      position="bottom-center"
      transition={Slide}
    />
  </React.Fragment>
);

export default Root;
