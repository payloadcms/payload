import React, { Component } from 'react';
import Input from 'payload/client/components/forms/Input';

class Filter extends Component {
  render() {
    return (
      <Input data-fillable placeholder="Search" type="text" id="keywords" />
    );
  }
}

export default Filter;
