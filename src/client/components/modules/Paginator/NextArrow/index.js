import React from 'react';
import PropTypes from 'prop-types';

import Arrow from '../../../graphics/Arrow';

import './index.scss';

const NextArrow = ({ updatePage }) => (
  <button
    className="paginator__next-arrow"
    onClick={updatePage}
    type="button"
  >
    <Arrow />
  </button>
);

NextArrow.defaultProps = {
  updatePage: null,
};

NextArrow.propTypes = {
  updatePage: PropTypes.func,
};

export default NextArrow;
