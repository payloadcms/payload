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
import getCSSVariable from '../utilities/getCSSVariable';

import './scss/app.scss';

const Index = () => (
  <React.Fragment>
    <ConfigProvider config={config}>
      <WindowInfoProvider breakpoints={{
        xs: parseInt(getCSSVariable('breakpoint-xs-width').replace('px', ''), 10),
        s: parseInt(getCSSVariable('breakpoint-s-width').replace('px', ''), 10),
        m: parseInt(getCSSVariable('breakpoint-m-width').replace('px', ''), 10),
        l: parseInt(getCSSVariable('breakpoint-l-width').replace('px', ''), 10),
      }}
      >
        <ScrollInfoProvider>
          <Router>
            <ModalProvider
              classPrefix="payload"
              zIndex={parseInt(getCSSVariable('z-modal'), 10)}
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
