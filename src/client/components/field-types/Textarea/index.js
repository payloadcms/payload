import React, { Component } from 'react';
import Tooltip from '../../modules/Tooltip';

import './index.css';

class Textarea extends Component {
  constructor() {
    super();

    this.errors = {
      text: 'Please fill in the field'
    };

    this.validate = this.validate.bind(this);
  }

  validate() {
    switch (this.props.type) {
    case 'honeypot':
      return this.el.value.length === 0;
    default:
      return this.el.value.length > 0;
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

    return (
      <div className={className} style={style}>
        <Error />
        <Label />
        <textarea
          ref={el => { this.el = el; } }
          onBlur={this.validate}
          onFocus={this.props.onFocus}
          onChange={this.props.change}
          id={this.props.id ? this.props.id : this.props.name}
          name={this.props.name}
          rows={this.props.rows ? this.props.rows : '5'}
          value={this.props.value}>
        </textarea>
      </div>
    );
  }
}

export default Textarea;
