import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const Tooltip = (props) => {
  const { className, children } = props;

  const classes = [
    'tooltip',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      {children}
      <span />
    </aside>
  );
};

Tooltip.defaultProps = {
  className: undefined,
};

Tooltip.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Tooltip;
