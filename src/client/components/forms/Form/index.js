import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

import ajax from '../../../ajax';

import './index.css';

class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fields: this.buildFields(),
      status: undefined,
      processing: false
    };

    // Fill from renderChildren
    this.childRefs = {};

    this.buildFields = this.buildFields.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
    this.renderChildren = this.renderChildren.bind(this);
  }

  buildFields() {
    let fields = {};

    React.Children.map(this.props.children, (child) => {
      if (child.props['data-fillable']) {
        fields[child.props.id] = {
          value: child.props.value ? child.props.value : '',
          required: child.props.required
        };
      }
    });

    return fields;
  }

  handleChange(e) {
    let newState = { ...this.state };
    newState.fields[e.target.id].value = e.target.value;
    this.setState(newState);
  }

  submit(e) {
    let isValid = true;
    let newState = { ...this.state };

    Object.keys(this.childRefs).forEach((field) => {
      if (this.childRefs[field].props.required) {
        let current = this.childRefs[field];

        let validated = current.validate();

        newState.fields[field].valid = validated;

        if (!validated) {
          isValid = false;
        }
      }
    });

    // Update validated fields
    this.setState(newState);

    // If not valid, prevent submission
    if (!isValid) {
      e.preventDefault();

    // If submit handler comes through via props, run that
    } else if (this.props.onSubmit) {
      e.preventDefault();
      this.props.onSubmit(this.state.fields);

    // If form is AJAX, fetch data
    } else if (this.props.ajax) {
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

    if (this.props.clearAfterSubmit && isValid) {
      // Loop through fields - if not valid, set to invalid, rerender with error
      Object.keys(this.state.fields).forEach((field) => {
        newState.fields[field].value = '';
      });
    }

    // If valid and not AJAX submit as usual
    return;
  }

  renderChildren() {
    let children = React.Children.map(this.props.children, (child) => {
      if (child.props['data-fillable']) {
        // Initialize validation as true - only show error class if error after blur
        let valid = true;

        // If a valid value has been passed from field, set valid equal to that
        if (typeof this.state.fields[child.props.id].valid !== 'undefined') {
          valid = this.state.fields[child.props.id].valid;
        }

        return React.cloneElement(child, {
          ref: (el) => {
            this.childRefs[child.props.id] = el;
          },
          change: this.handleChange,
          validate: this.validate,
          valid: valid,
          value: this.state.fields[child.props.id].value
        });
      }

      if (child.props['data-submit']) {
        return React.cloneElement(child, {
          disabled: this.state.processing || child.props.disabled === 'disabled' ? 'disabled' : false,
          children: this.state.processing ? 'Processing...' : child.props.children
        });
      }

      return child;
    });

    return children;
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
        {this.renderChildren()}
      </form>
    );
  }
}

export default withRouter(Form);
