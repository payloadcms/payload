import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './Button.css';

class Button extends Component {
  constructor(props) {
    super(props);

    let classes = this.props.className ? `btn ${this.props.className}` : 'btn';

    if (this.props.type) {
      classes += ` btn-${this.props.type}`;
    }

    if (this.props.size) {
      classes += ` btn-${this.props.size}`;
    }

    if (this.props.icon) {
      classes += ' btn-icon';
    }

    this.buttonProps = {
      className: classes,
      onClick: this.props.onClick,
      disabled: this.props.disabled,
      ...this.props
    };
  }

  render() {
    switch (this.props.el) {
    case 'link':
      return (
        <Link {...this.buttonProps} to={this.props.url}>
          {this.props.children}
        </Link>
      );

    case 'anchor':
      return (
        <a {...this.buttonProps} href={this.props.url}>
          {this.props.children}
        </a>
      );

    default:
      return (
        <button {...this.buttonProps}>
          {this.props.children}
        </button>
      );
    }
  }
}

export default Button;
