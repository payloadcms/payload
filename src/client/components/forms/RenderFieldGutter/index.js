import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'render-field-gutter';

const RenderFieldGutter = (props) => {
  const { children, variant, verticalAlignment, className, dragHandleProps } = props;

  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--v-align-${verticalAlignment}`,
    className && className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...dragHandleProps}>
      <div className={`${baseClass}__content-container`}>
        <div className={`${baseClass}__content`}>
          {children}
        </div>
      </div>
    </div>
  );
}

const { oneOf } = PropTypes;

RenderFieldGutter.defaultProps = {
  variant: 'left',
  verticalAlignment: 'sticky',
  dragHandleProps: {},
}

RenderFieldGutter.propTypes = {
  variant: oneOf(['left', 'right']),
  verticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
}

export default RenderFieldGutter;
