import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from '../../../DatePicker';

import './index.scss';

const baseClass = 'condition-value-date';

const DateField = ({ onChange, value }) => {
  return (
    <div className={baseClass}>
      <DatePicker
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

DateField.defaultProps = {
  value: undefined,
};

DateField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.instanceOf(Date),
};

export default DateField;
