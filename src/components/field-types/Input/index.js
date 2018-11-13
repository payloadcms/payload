import React, { Component } from 'react';
import { Tooltip, FormContext } from 'payload/components';

import './index.css';

class Input extends Component {
  constructor() {
    super();

    this.errors = {
      text: 'Please fill in the field',
      email: 'Please enter a valid email',
      password: 'Please enter a password'
    };

    this.state = {
      init: false
    };

    this.validate = this.validate.bind(this);
    this.sendField = this.sendField.bind(this);
  }

  validate(value) {
    let emailTest = /\S+@\S+\.\S+/;

    switch (this.props.type) {
    case 'text':
      return value.length > 0;

    case 'password':
      return value.length > 0;

    case 'email':
      return emailTest.test(value);

    case 'hidden':
      return true;

    default:
      return false;
    }
  }

  sendField(value) {
    return {
      name: this.props.name,
      value: value,
      valid: this.props.required
        ? this.validate(value)
        : true
    };
  }

  componentDidMount() {
    this.props.context.setValue(
      this.sendField(
        this.props.value ? this.props.value : ''
      )
    );

    this.setState({
      init: true
    });
  }

  render() {

    const valid = this.props.context.fields[this.props.name]
      ? this.props.context.fields[this.props.name].valid
      : true;

    const showError = valid === false && this.props.context.submitted;

    const Required = this.props.required
      ? () => <span className="required">*</span>
      : () => null;

    const Error = showError
      ? () => <Tooltip className="error-message">{this.errors[this.props.type]}</Tooltip>
      : () => null;

    const Label = this.props.label
      ? () => <label htmlFor={this.props.id ? this.props.id : this.props.name}>{this.props.label}<Required /></label>
      : () => null;

    let className = `interact ${this.props.type}`;
    className = !showError ? className : `${className} error`;

    const initialValue = this.props.value ? this.props.value : '';

    return (
      <div className={className} style={this.props.style}>
        <Error />
        <Label />
        <input
          value={
            this.props.context.fields[this.props.name]
              ? this.props.context.fields[this.props.name].value
              : initialValue
          }
          onChange={
            (e) => {
              this.props.context.setValue(this.sendField(e.target.value));
              this.props.onChange(e);
            }
          }
          disabled={this.props.disabled}
          placeholder={this.props.placeholder}
          type={this.props.type}
          id={this.props.id ? this.props.id : this.props.name}
          name={this.props.name} />
      </div>
    );
  }
}

const ContextInput = props => {
  return (
    <FormContext.Consumer>
      {context => <Input {...props} context={context} />}
    </FormContext.Consumer>
  );
};

export default ContextInput;
