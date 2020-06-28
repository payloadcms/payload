import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'template-minimal';

const Minimal = (props) => {
  const {
    className, style, children, width,
  } = props;

  const classes = [
    className,
    baseClass,
    `${baseClass}--width-${width}`,
  ].filter(Boolean).join(' ');

  return (
    <section
      className={classes}
      style={style}
    >
      <div className={`${baseClass}__wrap`}>
        {children}
      </div>
    </section>
  );
};

Minimal.defaultProps = {
  className: null,
  style: {},
  width: 'normal',
};

Minimal.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
  width: PropTypes.oneOf(['normal', 'wide']),
};

export default Minimal;
