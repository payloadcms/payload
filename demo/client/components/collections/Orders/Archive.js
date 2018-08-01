import React, { Component } from 'react';
import CollectionArchive from 'payload/client/components/views/CollectionArchive';
import HeadingButton from 'payload/client/components/layout/HeadingButton';

class OrdersArchive extends Component {

  render() {
    const attrs = {

    };

    return (
      <CollectionArchive collection="Orders">
        <HeadingButton
          heading="Orders"
          buttonLabel="Add New"
          buttonUrl="/collections/orders/add-new"
          buttonType="link" />
      </CollectionArchive>
    );
  }
}

export default OrdersArchive;
