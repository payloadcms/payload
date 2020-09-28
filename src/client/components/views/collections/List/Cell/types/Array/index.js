import React from 'react';
import PropTypes from 'prop-types';

const ArrayCell = ({ data, field }) => {
  const arrayFields = data ?? [];
  const label = `${arrayFields.length} ${field.label} rows`;

  return (
    <span>{label}</span>
  );
};

ArrayCell.defaultProps = {
  data: [],
};

ArrayCell.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  field: PropTypes.shape({
    singularLabel: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
};

export default ArrayCell;
