import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector = (props) => {
  const {
    handleChange,
  } = props;

  const [columns, setColumns] = useState('');

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(columns);
  }, [columns, handleChange]);

  return (
    <div className={baseClass}>
      Columns
    </div>
  );
};

ColumnSelector.defaultProps = {
  fieldName: 'id',
  fieldLabel: 'ID',
};

ColumnSelector.propTypes = {
  fieldName: PropTypes.string,
  fieldLabel: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
};

export default ColumnSelector;
