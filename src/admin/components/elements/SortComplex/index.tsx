import React, { useState, useEffect } from 'react';
import { Props } from './types';
import ReactSelect from '../ReactSelect';
import sortableFieldTypes from '../../../../fields/sortableFieldTypes';

import './index.scss';

const baseClass = 'sort-complex';

const sortOptions = [{ label: 'Ascending', value: '' }, { label: 'Descending', value: '-' }];

const SortComplex: React.FC<Props> = (props) => {
  const {
    collection,
    handleChange,
  } = props;

  const [sortFields] = useState(() => collection.fields.reduce((fields, field) => {
    if (field.name && sortableFieldTypes.indexOf(field.type) > -1) {
      return [
        ...fields,
        { label: field.label, value: field.name },
      ];
    }
    return fields;
  }, []));
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('-');

  useEffect(() => {
    if (sortField) {
      handleChange(`${sortOrder}${sortField}`);
    }
  }, [sortField, sortOrder, handleChange]);

  return (
    <div className={baseClass}>
      <React.Fragment>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>
              Column to Sort
            </div>
            <ReactSelect
              value={sortFields.find((field) => field.name === sortField)}
              options={sortFields}
              onChange={setSortField}
            />
          </div>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>
              Order
            </div>
            <ReactSelect
              value={sortOptions.find((order) => order.value === sortOrder)}
              options={sortOptions}
              onChange={setSortOrder}
              // onChange={(val) => console.log(val)}
            />
          </div>
        </div>
      </React.Fragment>
    </div>
  );
};

export default SortComplex;
