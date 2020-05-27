import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import reducer from './reducer';
import Condition from './Condition';
import fieldTypes from './field-types';

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
  const [reducedFields, setReducedFields] = useState([]);

  useEffect(() => {
    setReducedFields(fields.reduce((reduced, field) => {
      if (typeof fieldTypes[field.type] === 'object') {
        return [
          ...reduced,
          {
            label: field.label,
            value: field.name,
            ...fieldTypes[field.type],
          },
        ];
      }

      return reduced;
    }, []));
  }, [fields]);

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
          <ul className={`${baseClass}__or-filters`}>
            {where.map((or, orIndex) => {
              return (
                <li key={orIndex}>
                  {orIndex !== 0 && (
                    <div className={`${baseClass}__label`}>
                      Or
                    </div>
                  )}
                  <ul className={`${baseClass}__and-filters`}>
                    {or && or.map((_, andIndex) => {
                      return (
                        <li key={andIndex}>
                          {andIndex !== 0 && (
                            <div className={`${baseClass}__label`}>
                              And
                            </div>
                          )}
                          <Condition
                            value={where[orIndex][andIndex]}
                            orIndex={orIndex}
                            andIndex={andIndex}
                            key={andIndex}
                            fields={reducedFields}
                            dispatch={dispatchWhere}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
          <Button
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            onClick={() => dispatchWhere({ type: 'add' })}
          >
            Or
          </Button>
        </>
      )}
      {where.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>No filters set</div>
          <Button
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            onClick={() => dispatchWhere({ type: 'add' })}
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
