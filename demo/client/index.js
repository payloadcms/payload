import React from 'react';
import { render } from 'react-dom';

import { Test, Test2 } from 'payload';

// import App from 'payload/client/components/App';

// import Routes from './Routes';
// import store from './store';

console.log(Test);

const Index = () => {
  return (
    <React.Fragment>
      <Test />
      <Test2 />
    </React.Fragment>
  );
};

render(<Index />, document.getElementById('app'));
