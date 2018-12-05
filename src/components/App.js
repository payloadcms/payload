import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { MeasureWindow, MeasureScroll, LoadCollections } from 'payload/components';

import '../scss/app.scss';

const App = props => {
  return (
    <Provider store={props.store}>
      <Router>
        <React.Fragment>
          <LoadCollections collections={props.collections} />
          <MeasureScroll />
          <MeasureWindow />
          {props.children}
        </React.Fragment>
      </Router>
    </Provider>
  );
}

export default App;
