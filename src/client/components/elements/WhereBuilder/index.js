import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import reducer from './reducer';
import Condition from './Condition';

import './index.scss';

const baseClass = 'where-builder';

const WhereBuilder = (props) => {
  const {
    collection: {
      fields,
      labels: {
        plural,
      } = {},
    } = {},
    handleChange,
  } = props;

  const [where, dispatchWhere] = useReducer(reducer, []);

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(where);
  }, [where, handleChange]);

  return (
    <div className={baseClass}>
      {where.length > 0 && (
        <>
          <div className={`${baseClass}__label`}>
            Filter
            {' '}
            {plural}
            {' '}
            where
          </div>
          <ul className={`${baseClass}__filters`}>
            {where.map((condition, i) => {
              if (Array.isArray(condition)) {
                return (
                  <li key={i}>
                    <Condition
                      relation="and"
                      fields={fields}
                      handleChange={() => console.log('handling change')}
                    />
                  </li>
                );
              }

              return (
                <li key={i}>
                  <Condition
                    hideRelation={i === 0}
                    relation={i === 0 ? 'and' : 'or'}
                    fields={fields}
                    handleChange={() => console.log('handling change')}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
      {where.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>No filters set</div>
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
  collection: PropTypes.shape({
    fields: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default WhereBuilder;
