import React, { Component } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import MeasureWindow from 'payload/client/components/utilities/MeasureWindow';
import MeasureScroll from 'payload/client/components/utilities/MeasureScroll';
import LoadContent from 'payload/client/components/utilities/LoadContent';

import 'payload/client/scss/app.css';

class App extends Component {
  render() {
    return (
      <Provider store={this.props.store}>
        <Router>
          <React.Fragment>
            <MeasureScroll />
            <MeasureWindow />
            <LoadContent />
            {this.props.children}
          </React.Fragment>
        </Router>
      </Provider>
    );
  }
}

export default App;
