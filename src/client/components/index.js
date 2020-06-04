import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { ScrollInfoProvider } from '@trbl/react-scroll-info';
import { WindowInfoProvider } from '@trbl/react-window-info';
import { ModalProvider, ModalContainer } from '@trbl/react-modal';
import Loading from './elements/Loading';
import { SearchParamsProvider } from './utilities/SearchParams';
import { LocaleProvider } from './utilities/Locale';
import { StatusListProvider } from './elements/Status';
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
            transTime={0}
          >
            <UserProvider>
              <StatusListProvider>
                <SearchParamsProvider>
                  <LocaleProvider>
                    <Suspense fallback={<Loading />}>
                      <Routes />
                    </Suspense>
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
