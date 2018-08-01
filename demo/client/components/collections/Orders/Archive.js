import React, { Component } from 'react';
import CollectionArchive from 'payload/client/components/views/CollectionArchive';

class OrdersArchive extends Component {
  render() {
    return (
      <CollectionArchive collection="Orders">
        <h1>Orders</h1>
      </CollectionArchive>
    );
  }
}

export default OrdersArchive;
