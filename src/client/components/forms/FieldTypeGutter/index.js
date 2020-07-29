import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'field-type-gutter';

const FieldTypeGutter = (props) => {
  const { children, variant, verticalAlignment, className, dragHandleProps } = props;

  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--v-align-${verticalAlignment}`,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      {...dragHandleProps}
    >
      <div className={`${baseClass}__content-container`}>
        <div className={`${baseClass}__content`}>
          {children}
        </div>
      </div>
    </div>
  );
};

const { oneOf, shape, string, node } = PropTypes;

FieldTypeGutter.defaultProps = {
  variant: 'left',
  verticalAlignment: 'sticky',
  dragHandleProps: {},
  className: null,
  children: null,
};

FieldTypeGutter.propTypes = {
  variant: oneOf(['left', 'right']),
  verticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  dragHandleProps: shape({}),
  className: string,
  children: node,
};

export default FieldTypeGutter;
