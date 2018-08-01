import React, { Component } from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

class PagesArchive extends Component {
  render() {
    return (
      <div>
        <SetStepNav nav={ [
          {
            url: '/collections/pages',
            label: 'Pages'
          }
        ] } />
        <h1>Pages</h1>
      </div>
    );
  }
}

export default PagesArchive;
