import React, { Component } from 'react';
import { FormContext, Tooltip } from 'payload/components';

import './index.scss';

class Textarea extends Component {
  constructor() {
    super();

    this.errors = {
      text: 'Please fill in the field'
    };

    this.state = {
      init: false
    };

    this.validate = this.validate.bind(this);
    this.sendField = this.sendField.bind(this);
  }

  validate(value) {
    switch (this.props.type) {
    case 'honeypot':
      return value.length === 0;
    default:
      return value.length > 0;
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

  componentDidUpdate(prevProps) {
    if (prevProps.valueOverride !== this.props.valueOverride) {
      this.sendField(this.props.valueOverride);
    }
  }

  render() {
    const valid = this.props.context.fields[this.props.name]
      ? this.props.context.fields[this.props.name].valid
      : true;

    const showError = valid === false && this.props.context.submitted;

    const Required = this.props.required
      ? () => <span className="required">*</span>
      : () => null;

    let Error = showError
      ? () => <Tooltip className="error-message">{this.errors.text}</Tooltip>
      : () => null;

    const Label = this.props.label
      ? () => <label htmlFor={this.props.id ? this.props.id : this.props.name}>{this.props.label}<Required /></label>
      : () => null;

    let className = 'interact textarea';
    className = !showError ? className : `${className} error`;

    let style = this.props.style
      ? this.props.style
      : null;

    if (this.props.type === 'honeypot') {
      style = { position: 'fixed', left: '10000px', top: '-100px' };
      Error = () => null;
      className = 'interact';
    }

    const initialValue = this.props.value
      ? this.props.value
      : '';

    const contextValue = this.props.context.fields[this.props.name]
      ? this.props.context.fields[this.props.name].value
      : initialValue;

    const value = this.props.valueOverride
      ? this.props.valueOverride
      : contextValue;

    return (
      <div className={className} style={style}>
        <Error />
        <Label />
        <textarea
          value={ value }
          onChange={
            (e) => {
              this.props.context.setValue(this.sendField(e.target.value));
              this.props.onChange && this.props.onChange(e);
            }
          }
          disabled={this.props.disabled}
          placeholder={this.props.placeholder}
          type={this.props.type}
          id={this.props.id ? this.props.id : this.props.name}
          name={this.props.name}>
        </textarea>
      </div>
    );
  }
}

const ContextTextarea = props => {
  return (
    <FormContext.Consumer>
      {context => <Textarea {...props} context={context} />}
    </FormContext.Consumer>
  );
};

export default ContextTextarea;
