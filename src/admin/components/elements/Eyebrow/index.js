import React from 'react';
import PropTypes from 'prop-types';
import StepNav from '../StepNav';

import './index.scss';

const baseClass = 'eyebrow';

const Eyebrow = ({ actions }) => {
  return (
    <div className={baseClass}>
      <StepNav />
      {actions}
    </div>
  );
};

Eyebrow.defaultProps = {
  actions: null,
};

Eyebrow.propTypes = {
  actions: PropTypes.node,
};

export default Eyebrow;
