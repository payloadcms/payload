import React from 'react';
import { Link } from 'react-router-dom';

import './Button.css';

export default props => {
  let classes = props.className ? `btn ${props.className}` : 'btn';

  if (props.type) {
    classes += ` btn-${props.type}`;
  }

  if (props.size) {
    classes += ` btn-${props.size}`;
  }

  if (props.icon) {
    classes += ' btn-icon';
  }

  const buttonProps = {
    className: classes,
    onClick: props.onClick,
    ...props
  };

  switch (props.el) {
  case 'link':
    return (
      <Link {...buttonProps} to={props.url}>
        {props.children}
      </Link>
    );

  case 'anchor':
    return (
      <a {...buttonProps} href={props.url}>
        {props.children}
      </a>
    );

  default:
    return (
      <button {...buttonProps}>
        {props.children}
      </button>
    );
  }
};
