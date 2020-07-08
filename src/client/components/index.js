import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@faceless-ui/scroll-info';
import { WindowInfoProvider } from '@faceless-ui/window-info';
import { ModalProvider, ModalContainer } from '@faceless-ui/modal';
import { SearchParamsProvider } from './utilities/SearchParams';
import { LocaleProvider } from './utilities/Locale';
import StatusList, { StatusListProvider } from './elements/Status';
import { UserProvider } from './data/User';
import Routes from './Routes';
import getCSSVariable from '../../utilities/getCSSVariable';

import '../scss/app.scss';

const Index = () => {
  const windowInfoProps = {};

  windowInfoProps.breakpoints = {
    xs: parseInt(getCSSVariable('breakpoint-xs-width').replace('px', ''), 10),
    s: parseInt(getCSSVariable('breakpoint-s-width').replace('px', ''), 10),
    m: parseInt(getCSSVariable('breakpoint-s-width').replace('px', ''), 10),
    l: parseInt(getCSSVariable('breakpoint-l-width').replace('px', ''), 10),
  };

  return (
    <WindowInfoProvider {...windowInfoProps}>
      <ScrollInfoProvider>
        <Router>
          <ModalProvider
            classPrefix="payload"
            zIndex={parseInt(getCSSVariable('z-modal'), 10)}
          >
            <UserProvider>
              <StatusListProvider>
                <SearchParamsProvider>
                  <LocaleProvider>
                    <StatusList />
                    <Routes />
                  </LocaleProvider>
                </SearchParamsProvider>
              </StatusListProvider>
              <ModalContainer />
            </UserProvider>
          </ModalProvider>
        </Router>
      </ScrollInfoProvider>
    </WindowInfoProvider>
  );
};

render(<Index />, document.getElementById('app'));

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
