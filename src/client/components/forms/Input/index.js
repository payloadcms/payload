import React, { Component } from 'react';
import Tooltip from '../../modules/Tooltip';

import './index.css';

class Input extends Component {
  constructor() {
    super();

    this.errors = {
      text: 'Please fill in the field',
      email: 'Please enter a valid email'
    };

    this.validate = this.validate.bind(this);
  }

  validate() {
    let emailTest = /\S+@\S+\.\S+/;

    switch (this.props.type) {
    case 'text':
      return this.el.value.length > 0;

    case 'password':
      return this.el.value.length > 0;

    case 'email':
      return emailTest.test(this.el.value);

    case 'hidden':
      return true;

    default:
      return false;
    }
  }

  componentDidUpdate() {
    if (this.props.autoFocus) {
      this.el.focus();
    }
  }

  render() {
    const Required = this.props.required
      ? () => <span className="required">*</span>
      : () => null;

    const Error = !this.props.valid
      ? () => <Tooltip className="error-message">{this.errors[this.props.type]}</Tooltip>
      : () => null;

    const Label = this.props.label
      ? () => <label htmlFor={this.props.id}>{this.props.label}<Required /></label>
      : () => null;

    let className = `interact ${this.props.type}`;
    className = this.props.valid
      ? className
      : `${className} error`;

    return (
      <div className={className} style={this.props.style}>
        <Error />
        <Label />
        <input
          ref={el => { this.el = el; } }
          disabled={this.props.disabled}
          placeholder={this.props.placeholder}
          onChange={this.props.change}
          onFocus={this.props.onFocus}
          type={this.props.type}
          id={this.props.id}
          name={this.props.name ? this.props.name : this.props.id}
          value={this.props.value} />
      </div>
    );
  }
}

export default Input;
