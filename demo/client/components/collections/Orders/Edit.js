import React, { Component } from 'react';

class OrdersEdit extends Component {
  render() {
    return (
      <div>
        <h1>Edit order {this.props.match.params.id}</h1>
      </div>
    );
  }
}

export default OrdersEdit;
