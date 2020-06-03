import React from 'react';
import PropTypes from 'prop-types';
import { Group } from '../../../../../../../field-types';

const CustomGroup = (props) => {
  return (
    <div className="custom-group">
      <Group {...props} />
    </div>
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
