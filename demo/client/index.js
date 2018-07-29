import React, { Component } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import MeasureScroll from 'payload/client/components/utilities/MeasureScroll';
import store from 'payload/client/store';
import Routes from './components/routes';

import 'payload/client/scss/app.css';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <React.Fragment>
            <MeasureScroll />
            <Routes />
            <Link to="/">Dashboard</Link>
          </React.Fragment>
        </Router>
      </Provider>
    );
  }
}

render(<App />, document.getElementById('app'));
