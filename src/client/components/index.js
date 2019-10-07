import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import Routes from './routes';
import store from '../store';
import LoadConfig from './utilities/LoadConfig';
import MeasureWindow from './utilities/MeasureWindow';
import MeasureScroll from './utilities/MeasureScroll';
import SetLocale from './utilities/SetLocale';
import SetSearchParams from './utilities/SetSearchParams';

const Index = () => {
  return (
    <Provider store={store}>
      <Router>
        <MeasureScroll />
        <MeasureWindow />
        <LoadConfig />
        <SetLocale />
        <SetSearchParams />
        <Routes />
      </Router>
    </Provider>
  );
};

render(<Index />, document.getElementById('app'));
