import React from 'react';
import PropTypes from 'prop-types';
import { Group } from '../../../../../../../components/forms';

const CustomGroup = (props) => (
  <div className="custom-group">
    <Group {...props} />
  </div>
);

CustomGroup.defaultProps = {
  value: '',
};

CustomGroup.propTypes = {
  value: PropTypes.string,
};

export default CustomGroup;
