import React, { useState, useEffect } from 'react';
import { Props } from './types';
import Chevron from '../../icons/Chevron';
import Button from '../Button';

import './index.scss';

const baseClass = 'sort-column';

const SortColumn: React.FC<Props> = (props) => {
  const {
    label, handleChange, name, disable = false,
  } = props;
  const [sort, setSort] = useState(null);

  useEffect(() => {
    handleChange(sort);
  }, [sort, handleChange]);

  const desc = `-${name}`;
  const asc = name;

  const ascClasses = [`${baseClass}__asc`];
  if (sort === asc) ascClasses.push(`${baseClass}--active`);

  const descClasses = [`${baseClass}__desc`];
  if (sort === desc) descClasses.push(`${baseClass}--active`);

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{label}</span>
      {!disable && (
        <span className={`${baseClass}__buttons`}>
          <Button
            round
            buttonStyle="none"
            className={ascClasses.join(' ')}
            onClick={() => setSort(asc)}
          >
            <Chevron />
          </Button>
          <Button
            round
            buttonStyle="none"
            className={descClasses.join(' ')}
            onClick={() => setSort(desc)}
          >
            <Chevron />
          </Button>
        </span>
      )}
    </div>
  );
};

export default SortColumn;
