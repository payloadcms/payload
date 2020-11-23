import React from 'react';
import { Link } from 'react-router-dom';
import { Props } from './types';

import './index.scss';

const baseClass = 'banner';

const Banner: React.FC<Props> = ({
  children,
  className,
  to,
  icon,
  alignIcon,
  onClick,
  type,
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
      {children}
      {(icon && alignIcon === 'right') && (
        <React.Fragment>
          {icon}
        </React.Fragment>
      )}
    </RenderedType>
  );
};

export default Banner;
