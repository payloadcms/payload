import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import MeasureScroll from 'payload/client/components/utilities/MeasureScroll';
import store from 'payload/client/store';

import '../scss/app.css';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <React.Fragment>
          <MeasureScroll />
          <Router>
            {this.props.children}
          </Router>
        </React.Fragment>
      </Provider>
    );
  }
}

export default App;
