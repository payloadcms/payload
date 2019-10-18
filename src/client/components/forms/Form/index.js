import React, { Component, createContext } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import HiddenInput from '../../field-types/HiddenInput';
import api from '../../../api';

import './index.scss';

export const FormContext = createContext({});

const mapState = state => ({
  searchParams: state.common.searchParams
})

const mapDispatch = dispatch => ({
  addStatus: status => dispatch({ type: 'ADD_STATUS', payload: status })
})

class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fields: {},
      status: null,
      submitted: false,
      processing: false
    };
  }

  setValue = field => {
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

  submit = e => {
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

          // If prop handleAjaxResponse is passed, pass it the response
          this.props.handleAjaxResponse && this.props.handleAjaxResponse(res);

          // Provide form data to the redirected page
          if (this.props.redirect) {
            this.props.history.push(this.props.redirect, data);
          } else {
            this.setState({ processing: false });
            this.props.addStatus({
              message: res.message,
              type: 'success'
            })
          }
        },
        error => {
          console.log(error);
          this.setState({ processing: false });
          this.props.addStatus({
            message: error.message,
            type: 'error'
          })
        }
      );
    }

    // If valid and not AJAX submit as usual
    return;
  }

  render() {

    return (
      <form
        noValidate
        onSubmit={this.submit}
        method={this.props.method}
        action={this.props.action}
        className={this.props.className}>
        <FormContext.Provider value={{
          setValue: this.setValue.bind(this),
          fields: this.state.fields,
          processing: this.state.processing,
          submitted: this.state.submitted
        }}>
          <HiddenInput
            name="locale"
            valueOverride={this.props.searchParams.locale} />
          {this.props.children}
        </FormContext.Provider>
      </form>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(Form));
