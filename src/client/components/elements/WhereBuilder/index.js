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
      slug,
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
        const formattedField = {
          label: field.label,
          value: field.name,
          ...fieldTypes[field.type],
        };

        return [
          ...reduced,
          formattedField,
        ];
      }

      return reduced;
    }, []));
  }, [fields]);

  useEffect(() => {
    const whereQuery = {
      or: [],
    };

    if (where) {
      whereQuery.or = where.map((or) => {
        return or.reduce((and, condition) => {
          const { field, operator, value } = condition;
          if (field && operator && value) {
            return {
              ...and,
              [field]: {
                [operator]: value,
              },
            };
          }

          return and;
        }, {});
      });
    }

    if (typeof handleChange === 'function') handleChange(whereQuery);
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
                            collectionSlug={slug}
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
            className={`${baseClass}__add-or`}
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
            className={`${baseClass}__add-first-filter`}
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
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default WhereBuilder;
