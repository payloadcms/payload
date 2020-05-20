import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'where-builder';

const WhereBuilder = (props) => {
  const {
    handleChange,
  } = props;

  const [where, setWhere] = useState('');

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(where);
  }, [where, handleChange]);

  return (
    <div className={baseClass}>
      Build a where clause
    </div>
  );
};

WhereBuilder.propTypes = {
  handleChange: PropTypes.func.isRequired,
};

export default WhereBuilder;
