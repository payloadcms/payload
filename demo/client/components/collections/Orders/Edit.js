import React, { Component } from 'react';
import ViewEdit from 'payload/client/components/views/collections/Edit';

class OrdersEdit extends Component {
  render() {
    return (
      <ViewEdit slug="orders" id={this.props.match.params.id}>
        <h1>Edit Order {this.props.match.params.id}</h1>
      </ViewEdit>
    );
  }
}

export default OrdersEdit;
