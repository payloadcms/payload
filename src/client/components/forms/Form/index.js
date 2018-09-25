import React, { Component, createContext } from 'react';
import { ajax } from 'payload';

import './index.css';

export const FormContext = createContext({});

class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fields: {},
      status: undefined,
      processing: false
    };

    this.submit = this.submit.bind(this);
  }

  handleChange(e, validate) {
    let valid = validate(e.target.value);

    this.setState({
      fields: {
        ...this.state.fields,
        [e.target.name]: {
          value: e.target.value,
          valid: valid
        }
      }
    });
  }

  submit(e) {

    e.preventDefault();

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
      ajax.requests[this.props.method](this.props.action, data).then(
        (res) => {
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
        onSubmit={this.submit}
        method={this.props.method}
        action={this.props.action}
        className={this.props.className}>
        <Status />
        <FormContext.Provider value={{
          handleChange: this.handleChange.bind(this),
          fields: this.state.fields,
          processing: this.state.processing
        }}>
          {this.props.children}
        </FormContext.Provider>
      </form>
    );
  }
}

export default Form;
