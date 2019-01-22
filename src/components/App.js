import React from 'react';
import { Provider, connect } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { LoadGlobals, MeasureWindow, MeasureScroll, SetLocale, SetSearchParams } from 'payload/components';

import '../scss/app.scss';

const App = props => {
  return (
    <Provider store={props.store}>
      <React.Fragment>
        <AppWithGlobals>
          {props.children}
        </AppWithGlobals>
        <MeasureScroll />
        <MeasureWindow />
        <LoadGlobals config={props.config} collections={props.collections} />
      </React.Fragment>
    </Provider>
  );
}

const mapState = state => ({
  config: state.common.config
})

const AppWithGlobals = connect(mapState)(props => {
  if (props.config) {
    return (
      <Router>
        <React.Fragment>
          <SetLocale />
          <SetSearchParams />
          {props.children}
        </React.Fragment>
      </Router>
    )
  }

  return null;
})

export default App;
