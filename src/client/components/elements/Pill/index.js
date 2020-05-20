import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'pill';

const Pill = ({
  children, className, to, icon, alignIcon, onClick, pillStyle,
}) => {
  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
  ].filter(Boolean).join(' ');

  let RenderedType = 'div';

  if (onClick && !to) RenderedType = 'button';
  if (to) RenderedType = Link;

  return (
    <RenderedType
      className={classes}
      onClick={onClick}
      type={RenderedType === 'button' ? 'button' : undefined}
      to={to || undefined}
    >
      {(icon && alignIcon === 'left') && (
        <>
          {icon}
        </>
      )}
      {children}
      {(icon && alignIcon === 'right') && (
        <>
          {icon}
        </>
      )}
    </RenderedType>
  );
};

Pill.defaultProps = {
  children: undefined,
  className: '',
  to: undefined,
  icon: undefined,
  alignIcon: 'right',
  onClick: undefined,
  pillStyle: 'light',
};

Pill.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  to: PropTypes.string,
  icon: PropTypes.node,
  alignIcon: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  pillStyle: PropTypes.oneOf(['light', 'dark']),
};

export default Pill;
