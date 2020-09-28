import React from 'react';
import PropTypes from 'prop-types';

const SelectCell = ({ data }) => (
  <span>
    {data.join(', ')}
  </span>
);

SelectCell.defaultProps = {
  data: [],
};

SelectCell.propTypes = {
  data: PropTypes.arrayOf(PropTypes.string),
};

export default SelectCell;
