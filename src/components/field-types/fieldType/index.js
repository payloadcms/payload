import React, { Component } from 'react';
import { FormContext, Tooltip } from 'payload/components';

import './index.scss';

const fieldType = (PassedComponent, slug, validate, errors) => {

  class FieldType extends Component {

    constructor(props) {
      super(props);

      this.state = {
        init: false
      };
    }

    sendField(value) {
      this.props.context.setValue({
        name: this.props.name,
        value: value,
        valid: this.props.required
          ? validate(value, this.props.type)
          : true
      });
    }

    componentDidMount() {
      let value = this.props.value ? this.props.value : '';
      value = this.props.valueOverride ? this.props.valueOverride : value;
      this.sendField(value);

      this.setState({
        init: true
      });
    }

    componentDidUpdate(prevProps) {
      if (prevProps.valueOverride !== this.props.valueOverride) {
        this.sendField(this.props.valueOverride);
      }

      if (prevProps.initialValue !== this.props.initialValue) {
        this.sendField(this.props.initialValue);
      }
    }

    render() {
      const valid = this.props.context.fields[this.props.name]
      ? this.props.context.fields[this.props.name].valid
      : true;

      const showError = valid === false && this.props.context.submitted;

      let className = `field-type ${slug}${showError ? ' error' : ''}`;

      let value = this.props.context.fields[this.props.name] ? this.props.context.fields[this.props.name].value : '';

      // If valueOverride present, field is being controlled by state outside form
      value = this.props.valueOverride ? this.props.valueOverride : value;

      return (
        <PassedComponent {...this.props}
        className={className}
        value={value}
        label={<Label {...this.props} />}
        error={<Error showError={showError} type={this.props.type} />}
        onChange={e => {
          this.sendField(e.target.value);
          this.props.onChange && this.props.onChange(e);
        }} />
      )
    }
  }

  const Label = props => {
    if (props.label) {
      return (
        <label htmlFor={props.id ? props.id : props.name}>
          {props.label}
          {props.required &&
            <span className="required">*</span>
          }
        </label>
      )
    }

    return null;
  }

  const Error = props => {
    if (props.showError) {
      return (
        <Tooltip className="error-message">
          {props.type && errors[props.type]}

          {!props.type && errors}
        </Tooltip>
      )
    }

    return null;
  }

  const FieldTypeWithContext = props => {
    return (
      <FormContext.Consumer>
        {context => <FieldType {...props} context={context} />}
      </FormContext.Consumer>
    );
  };

  return FieldTypeWithContext;
}

export default fieldType;
