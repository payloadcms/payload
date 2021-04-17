import React, { useState, useEffect, useReducer } from 'react';
import getInitialState from './getInitialState';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import { Props } from './types';

import './index.scss';

const baseClass = 'column-selector';

const reducer = (state, { type, payload }) => {
  if (type === 'enable') {
    return [
      ...state,
      payload,
    ];
  }

  if (type === 'replace') {
    return [
      ...payload,
    ];
  }

  return state.filter((remainingColumn) => remainingColumn !== payload);
};

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    collection: {
      admin: {
        useAsTitle,
        defaultColumns,
      },
    },
    handleChange,
  } = props;

  const [initialColumns, setInitialColumns] = useState([]);
  const [fields] = useState(() => flattenTopLevelFields(collection.fields));
  const [columns, dispatchColumns] = useReducer(reducer, initialColumns);

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(columns);
  }, [columns, handleChange]);

  useEffect(() => {
    const { columns: initializedColumns } = getInitialState(fields, useAsTitle, defaultColumns);
    setInitialColumns(initializedColumns);
  }, [fields, useAsTitle, defaultColumns]);

  useEffect(() => {
    dispatchColumns({ payload: initialColumns, type: 'replace' });
  }, [initialColumns]);

  return (
    <div className={baseClass}>
      {fields && fields.map((field, i) => {
        const isEnabled = columns.find((column) => column === field.name);
        return (
          <Pill
            onClick={() => dispatchColumns({ payload: field.name, type: isEnabled ? 'disable' : 'enable' })}
            alignIcon="left"
            key={field.name || i}
            icon={isEnabled ? <X /> : <Plus />}
            pillStyle={isEnabled ? 'dark' : undefined}
            className={`${baseClass}__active-column`}
          >
            {field.label || field.name}
          </Pill>
        );
      })}
    </div>
  );
};

export default ColumnSelector;
