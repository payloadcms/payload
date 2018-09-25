import React, { Component } from 'react';
import { FormConsumer, Tooltip } from 'payload/components';

import './index.css';

class Textarea extends Component {
  constructor() {
    super();

    this.errors = {
      text: 'Please fill in the field'
    };

    this.validate = this.validate.bind(this);
  }

  validate(value) {
    switch (this.props.type) {
    case 'honeypot':
      return value.length === 0;
    default:
      return value.length > 0;
    }
  }

  render() {
    const Required = this.props.required
      ? () => <span className="required">*</span>
      : () => null;

    const Error = this.props.valid === false
      ? () => <Tooltip className="error-message">{this.errors.text}</Tooltip>
      : () => null;

    const Label = this.props.label
      ? () => <label htmlFor={this.props.id ? this.props.id : this.props.name}>{this.props.label}<Required /></label>
      : () => null;

    let className = 'interact textarea';
    className = this.props.valid !== false ? className : `${className} error`;

    let style = this.props.style
      ? this.props.style
      : null;

    if (this.props.type === 'honeypot') {
      style = { position: 'fixed', left: '10000px', top: '-100px' };
      Error = () => null;
      className = 'interact';
    }

    const validate = this.props.required ? this.validate : () => true;

    return (
      <FormConsumer>
        {context => {
          return (
            <div className={className} style={style}>
              <Error />
              <Label />
              <textarea
                value={context.fields[this.props.name] ? context.fields[this.props.name].value : ''}
                onChange={(e) => { context.handleChange(e, validate) }}
                disabled={this.props.disabled}
                placeholder={this.props.placeholder}
                type={this.props.type}
                id={this.props.id ? this.props.id : this.props.name}
                name={this.props.name}>
              </textarea>
            </div>
          )
        }}
      </FormConsumer>
    );
  }
}

export default Textarea;
