import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import Init from './utilities/Init';
import { SearchParamsProvider } from './utilities/SearchParams';
import { LocaleProvider } from './utilities/Locale';
import { StatusListProvider } from './modules/Status';
import Routes from './Routes';

import '../scss/app.scss';

const Index = () => {
  return (
    <Init>
      <Router>
        <SearchParamsProvider>
          <LocaleProvider>
            <StatusListProvider>
              <Routes />
            </StatusListProvider>
          </LocaleProvider>
        </SearchParamsProvider>
      </Router>
    </Init>
  );
};

render(<Index />, document.getElementById('app'));

// Needed for Hot Module Replacement
if (typeof (module.hot) !== 'undefined') {
  module.hot.accept();
}
