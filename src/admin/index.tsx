// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - need to do this because this file doesn't actually exist
import config from 'payload-config';
import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
import { ModalProvider, ModalContainer } from '@faceless-ui/modal';
import { ToastContainer, Slide } from 'react-toastify';
import { ConfigProvider, AuthProvider } from '@payloadcms/config-provider';
import { SearchParamsProvider } from './components/utilities/SearchParams';
import { LocaleProvider } from './components/utilities/Locale';
import Routes from './components/Routes';

import './scss/app.scss';

const Index = () => (
  <React.Fragment>
    <ConfigProvider config={config}>
      <WindowInfoProvider breakpoints={{
        xs: 400,
        s: 768,
        m: 1024,
        l: 1440,
      }}
      >
        <ScrollInfoProvider>
          <Router>
            <ModalProvider
              classPrefix="payload"
              zIndex={50}
            >
              <AuthProvider>
                <SearchParamsProvider>
                  <LocaleProvider>
                    <Routes />
                  </LocaleProvider>
                </SearchParamsProvider>
                <ModalContainer />
              </AuthProvider>
            </ModalProvider>
          </Router>
        </ScrollInfoProvider>
      </WindowInfoProvider>
    </ConfigProvider>
    <ToastContainer
      position="bottom-center"
      transition={Slide}
    />
  </React.Fragment>
);

render(<Index />, document.getElementById('app'));

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
