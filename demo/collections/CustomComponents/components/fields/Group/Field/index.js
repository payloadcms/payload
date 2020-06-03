import React from 'react';
import PropTypes from 'prop-types';

const CustomGroup = ({ onChange, value }) => {
  return (
    <input
      className="custom-description-filter"
      type="text"
      onChange={e => onChange(e.target.value)}
      value={value}
    />
  );
};

CustomGroup.defaultProps = {
  value: '',
};

CustomGroup.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default CustomGroup;
