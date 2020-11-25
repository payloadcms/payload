import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './index.scss';

const baseClass = 'banner';

const Banner = ({
  children, className, to, icon, alignIcon, onClick, type,
}) => {
  const classes = [
    baseClass,
    `${baseClass}--type-${type}`,
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
        <React.Fragment>
          {icon}
        </React.Fragment>
      )}
      <span className={`${baseClass}__content`}>
        {children}
      </span>
      {(icon && alignIcon === 'right') && (
        <React.Fragment>
          {icon}
        </React.Fragment>
      )}
    </RenderedType>
  );
};

Banner.defaultProps = {
  children: undefined,
  className: '',
  to: undefined,
  icon: undefined,
  alignIcon: 'right',
  onClick: undefined,
  type: 'default',
};

Banner.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icon: PropTypes.node,
  alignIcon: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  to: PropTypes.string,
  type: PropTypes.oneOf(['error', 'success', 'info', 'default']),
};

export default Banner;
