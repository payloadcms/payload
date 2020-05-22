import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import reducer from './reducer';

import './index.scss';

const baseClass = 'where-builder';

const WhereBuilder = (props) => {
  const {
    handleChange,
  } = props;

  const [where, dispatchWhere] = useReducer(reducer, []);

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(where);
  }, [where, handleChange]);

  return (
    <div className={baseClass}>
      {where.length > 0 && where.map((condition) => {
        if (Array.isArray(condition)) {
          return (
            <div className={`${baseClass}__filters`}>
              <div>Filter pages where</div>
            </div>
          );
        }
      })}
      {where.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <p>No filters set</p>
          <Button
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            onClick={() => dispatchWhere({ type: 'add', payload: { query: {} } })}
          >
            Add filter
          </Button>
        </div>
      )}
    </div>
  );
};

WhereBuilder.propTypes = {
  handleChange: PropTypes.func.isRequired,
};

export default WhereBuilder;
