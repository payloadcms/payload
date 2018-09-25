import React, { Component } from 'react';
import { FormConsumer, Button } from 'payload/components';

class FormSubmit extends Component {
  render() {
    return (
      <FormConsumer>
        {context => {
          return (
            <Button disabled={context.processing ? 'disabled' : ''}>
              {this.props.children}
            </Button>
          )
        }}
      </FormConsumer>
    );
  }
}

export default FormSubmit;
