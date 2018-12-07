import React, { Component, createContext } from 'react';
import { Input } from 'payload/components';
import api from 'payload/api';

import './index.scss';

export const FormContext = createContext({});

class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fields: {},
      status: null,
      submitted: false,
      processing: false
    };

    this.submit = this.submit.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  setValue(field) {
    this.setState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [field.name]: {
          value: field.value,
          valid: field.valid
        }
      }
    }));
  }

  submit(e) {
    this.setState({
      submitted: true
    });

    let isValid = true;

    Object.keys(this.state.fields).forEach((field) => {
      if (!this.state.fields[field].valid) {
        isValid = false;
      }
    });

    // If not valid, prevent submission
    if (!isValid) {
      e.preventDefault();

    // If submit handler comes through via props, run that
    } else if (this.props.onSubmit) {
      e.preventDefault();
      this.props.onSubmit(this.state.fields);

    // If form is AJAX, fetch data
    } else if (this.props.ajax !== false) {
      e.preventDefault();
      let data = {};

      // Clean up data passed from field state
      Object.keys(this.state.fields).forEach((field) => {
        data[field] = this.state.fields[field].value;
      });

      this.setState({
        processing: true
      });

      // Make the API call from the action
      api.requests[this.props.method.toLowerCase()](this.props.action, data).then(
        res => {
          // Provide form data to the redirected page
          if (this.props.redirect) {
            this.props.history.push(this.props.redirect, data);
          } else {
            this.setState({
              status: {
                message: res.msg,
                type: 'success'
              },
              processing: false
            });
          }
        },
        (error) => {
          console.log(error);
          this.setState({
            status: {
              message: 'Sorry, there was a problem with your request.',
              type: 'error'
            },
            processing: false
          });
        }
      );
    }

    // If valid and not AJAX submit as usual
    return;
  }

  render() {

    let Status = () => {
      return null;
    };

    if (this.state.status && !this.state.redirect) {
      Status = () => {
        return (
          <div className={`status open ${this.state.status.type}`}>
            {this.state.status.message}
          </div>
        );
      };
    }

    return (
      <form
      noValidate
      onSubmit={this.submit}
      method={this.props.method}
      action={this.props.action}
      className={this.props.className}>
        <Status />
        <FormContext.Provider value={{
          setValue: this.setValue.bind(this),
          fields: this.state.fields,
          processing: this.state.processing,
          submitted: this.state.submitted
        }}>
          {this.props.children}
        </FormContext.Provider>
      </form>
    );
  }
}

export default Form;
