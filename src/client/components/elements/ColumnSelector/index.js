import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';

import './index.scss';

const baseClass = 'column-selector';

const reducer = (state, { type, column }) => {
  if (type === 'enable') {
    return [
      ...state,
      column,
    ];
  }

  return state.filter(remainingColumn => remainingColumn !== column);
};

const ColumnSelector = (props) => {
  const {
    handleChange,
    fields,
  } = props;

  const [columns, dispatchColumns] = useReducer(reducer, []);

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(columns);
  }, [columns, handleChange]);

  return (
    <div className={baseClass}>
      {fields && fields.map((field) => {
        if (field?.hidden !== true || field?.hidden?.admin !== true) {
          const isEnabled = columns.find(column => column === field.name);
          return (
            <Pill
              onClick={() => dispatchColumns({ column: field.name, type: isEnabled ? 'disable' : 'enable' })}
              alignIcon="left"
              key={field.name}
              icon={isEnabled ? <X /> : <Plus />}
              pillStyle={isEnabled ? 'dark' : undefined}
              className={`${baseClass}__active-column`}
            >
              {field.label}
            </Pill>
          );
        }

        return null;
      })}
    </div>
  );
};

ColumnSelector.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default ColumnSelector;
