import React, { Component } from 'react';
import CollectionArchive from 'payload/client/components/views/CollectionArchive';
import HeadingButton from 'payload/client/components/layout/HeadingButton';

class PagesArchive extends Component {
  render() {
    return (
      <CollectionArchive collection="Pages">
        <HeadingButton
          heading="Pages"
          buttonLabel="Add New"
          buttonUrl="/collections/pages/add-new"
          buttonType="link" />
      </CollectionArchive>
    );
  }
}

export default PagesArchive;
