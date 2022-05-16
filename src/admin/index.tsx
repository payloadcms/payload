// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
import config from 'payload-config';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
import { ModalProvider, ModalContainer } from '@faceless-ui/modal';
import { ToastContainer, Slide } from 'react-toastify';
import { AuthProvider } from './components/utilities/Auth';
import { ConfigProvider } from './components/utilities/Config';
import { PreferencesProvider } from './components/utilities/Preferences';
import { CustomProvider } from './components/utilities/CustomProvider';
import { SearchParamsProvider } from './components/utilities/SearchParams';
import { LocaleProvider } from './components/utilities/Locale';
import Routes from './components/Routes';
import { StepNavProvider } from './components/elements/StepNav';

import './scss/app.scss';

const Index = () => (
  <React.Fragment>
    <ConfigProvider config={config}>
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
              zIndex={50}
            >
              <AuthProvider>
                <PreferencesProvider>
                  <SearchParamsProvider>
                    <LocaleProvider>
                      <StepNavProvider>
                        <CustomProvider>
                          <Routes />
                        </CustomProvider>
                      </StepNavProvider>
                    </LocaleProvider>
                  </SearchParamsProvider>
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

const container = document.getElementById('app');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<Index />);

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
