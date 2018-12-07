import React, { Component } from 'react';
import { FormContext, Tooltip } from 'payload/components';

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
      this.sendField(
        this.props.value ? this.props.value : ''
      )

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

      const initialValue = this.props.initialValue
        ? this.props.initialValue
        : '';

      const contextValue = (this.props.context.fields[this.props.name] && this.props.context.fields[this.props.name].value)
        ? this.props.context.fields[this.props.name].value
        : initialValue;

      const value = this.props.valueOverride
        ? this.props.valueOverride
        : contextValue;

      return (
        <PassedComponent {...this.props}
        className={className}
        value={value}
        onChange={e => {
          this.sendField(e.target.value);
          this.props.onChange && this.props.onChange(e);
        }}
        Label={<Label {...this.props} />}
        Error={<Error showError={showError} />}
         />
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
          {errors[this.props.type]}
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
