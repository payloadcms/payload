import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { SearchParamsProvider } from './utilities/SearchParams';
import { LocaleProvider } from './utilities/Locale';
import { StatusListProvider } from './modules/Status';
import Routes from './Routes';

import '../scss/app.scss';

const Index = () => {
  return (
    <Router>
      <SearchParamsProvider>
        <LocaleProvider>
          <StatusListProvider>
            <Routes />
          </StatusListProvider>
        </LocaleProvider>
      </SearchParamsProvider>
    </Router>
  );
};

render(<Index />, document.getElementById('app'));

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
