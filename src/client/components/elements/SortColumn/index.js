import React, { useState, useEffect } from 'react';
import { useWindowInfo } from '@trbl/react-window-info';
import PropTypes from 'prop-types';
import Chevron from '../../icons/Chevron';
import Button from '../Button';

import './index.scss';

const baseClass = 'sort-column';

const SortColumn = (props) => {
  const { label, handleChange, name } = props;
  const [sort, setSort] = useState(null);
  const [hovered, setHovered] = useState(false);

  const { breakpoints: { m } } = useWindowInfo();

  useEffect(() => {
    handleChange(sort);
  }, [sort, handleChange]);

  const desc = `-${name}`;
  const asc = name;

  return (
    <div
      className={baseClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`${baseClass}__label`}>{label}</span>
      <span className={`${baseClass}__buttons`}>
        <Button
          round
          buttonStyle="none"
          className={`${baseClass}__asc${sort === asc ? ` ${baseClass}--active` : ''}`}
          onClick={() => setSort(asc)}
        >
          <Chevron />
        </Button>
        <Button
          round
          buttonStyle="none"
          className={`${baseClass}__desc${sort === desc ? ` ${baseClass}--active` : ''}`}
          onClick={() => setSort(desc)}
        >
          <Chevron />
        </Button>
      </span>
    </div>
  );
};

SortColumn.propTypes = {
  label: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
};

export default SortColumn;
