import React from 'react';
import { Link } from 'react-router-dom';
import { Props, RenderedTypeProps } from './types';

import './index.scss';

const baseClass = 'banner';

export const Banner: React.FC<Props> = ({
  children,
  className,
  to,
  icon,
  alignIcon = 'right',
  onClick,
  type = 'default',
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

  let RenderedType: string | React.ComponentType<RenderedTypeProps> = 'div';

  if (onClick && !to) RenderedType = 'button';
  if (to) RenderedType = Link;

  return (
    <RenderedType
      className={classes}
      onClick={onClick}
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

export default Banner;
