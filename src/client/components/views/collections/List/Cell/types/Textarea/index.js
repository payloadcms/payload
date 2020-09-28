import React from 'react';
import PropTypes from 'prop-types';

const TextareaCell = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substr(0, 100)}\u2026` : data;
  return (
    <span>{textToShow}</span>
  );
};

TextareaCell.defaultProps = {
  data: [],
};

TextareaCell.propTypes = {
  data: PropTypes.string,
  field: PropTypes.shape({
    singularLabel: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
};

export default TextareaCell;
