import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
import { ModalProvider, ModalContainer } from '@faceless-ui/modal';
import { SearchParamsProvider } from './components/utilities/SearchParams';
import { LocaleProvider } from './components/utilities/Locale';
import StatusList, { StatusListProvider } from './components/elements/Status';
import { AuthenticationProvider } from './components/providers/Authentication';
import Routes from './components/Routes';
import getCSSVariable from '../utilities/getCSSVariable';
import ConfigProvider from './components/providers/Config/Provider';

import './scss/app.scss';

const Index = () => {
  const windowInfoProps = {};

  windowInfoProps.breakpoints = {
    xs: parseInt(getCSSVariable('breakpoint-xs-width').replace('px', ''), 10),
    s: parseInt(getCSSVariable('breakpoint-s-width').replace('px', ''), 10),
    m: parseInt(getCSSVariable('breakpoint-m-width').replace('px', ''), 10),
    l: parseInt(getCSSVariable('breakpoint-l-width').replace('px', ''), 10),
  };

  return (
    <ConfigProvider>
      <WindowInfoProvider {...windowInfoProps}>
        <ScrollInfoProvider>
          <Router>
            <ModalProvider
              classPrefix="payload"
              zIndex={parseInt(getCSSVariable('z-modal'), 10)}
            >
              <AuthenticationProvider>
                <StatusListProvider>
                  <SearchParamsProvider>
                    <LocaleProvider>
                      <StatusList />
                      <Routes />
                    </LocaleProvider>
                  </SearchParamsProvider>
                </StatusListProvider>
                <ModalContainer />
              </AuthenticationProvider>
            </ModalProvider>
          </Router>
        </ScrollInfoProvider>
      </WindowInfoProvider>
    </ConfigProvider>
  );
};

render(<Index />, document.getElementById('app'));

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
