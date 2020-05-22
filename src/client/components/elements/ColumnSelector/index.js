import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import getInitialState from './getInitialState';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';

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

  return state.filter(remainingColumn => remainingColumn !== payload);
};

const ColumnSelector = (props) => {
  const {
    handleChange,
    fields,
    useAsTitle,
    defaultColumns,
  } = props;

  const [initialColumns, setInitialColumns] = useState([]);
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
      {fields && fields.map((field) => {
        const isEnabled = columns.find(column => column === field.name);
        return (
          <Pill
            onClick={() => dispatchColumns({ payload: field.name, type: isEnabled ? 'disable' : 'enable' })}
            alignIcon="left"
            key={field.name}
            icon={isEnabled ? <X /> : <Plus />}
            pillStyle={isEnabled ? 'dark' : undefined}
            className={`${baseClass}__active-column`}
          >
            {field.label}
          </Pill>
        );
      })}
    </div>
  );
};

ColumnSelector.defaultProps = {
  defaultColumns: undefined,
  useAsTitle: undefined,
};

ColumnSelector.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  defaultColumns: PropTypes.arrayOf(
    PropTypes.string,
  ),
  useAsTitle: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
};

export default ColumnSelector;
