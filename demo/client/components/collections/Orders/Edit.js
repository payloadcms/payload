import React, { Component } from 'react';
import CollectionEdit from 'payload/client/components/views/CollectionEdit';

class OrdersEdit extends Component {
  render() {
    return (
      <CollectionEdit collection="Orders" id={this.props.match.params.id}>
        <h1>Edit Order {this.props.match.params.id}</h1>
      </CollectionEdit>
    );
  }
}

export default OrdersEdit;
