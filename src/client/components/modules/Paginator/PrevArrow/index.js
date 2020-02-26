import React from 'react';
import PropTypes from 'prop-types';

import Arrow from '../../../graphics/Arrow';

import './index.scss';

const PrevArrow = ({ updatePage }) => (
  <button
    className="paginator__prev-arrow"
    onClick={updatePage}
    type="button"
  >
    <Arrow />
  </button>
);

PrevArrow.defaultProps = {
  updatePage: null,
};

PrevArrow.propTypes = {
  updatePage: PropTypes.func,
};

export default PrevArrow;
