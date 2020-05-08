import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'template-minimal';

const Minimal = (props) => {
  const {
    className, style, children,
  } = props;

  const classes = [
    className,
    baseClass,
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
};

Minimal.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
};

export default Minimal;
