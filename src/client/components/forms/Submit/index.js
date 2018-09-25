import React, { Component } from 'react';
import { FormContext, Button } from 'payload/components';

class FormSubmit extends Component {
  render() {
    return (
      <Button disabled={this.props.context.processing ? 'disabled' : ''}>
        {this.props.children}
      </Button>
    );
  }
}

export default props => {
  return (
    <FormContext.Consumer>
      {context => <FormSubmit {...props} context={context} />}
    </FormContext.Consumer>
  );
};

