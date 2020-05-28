import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const Filter = ({ onChange, value }) => {
  return (
    <input
      className="custom-description-filter"
      type="text"
      onChange={e => onChange(e.target.value)}
      value={value}
    />
  );
};

Filter.defaultProps = {
  value: '',
};

Filter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default Filter;
