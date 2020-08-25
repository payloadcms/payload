import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import Button from '../Button';
import reducer from './reducer';
import Condition from './Condition';
import fieldTypes from './field-types';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';

import './index.scss';

const baseClass = 'where-builder';

const validateWhereQuery = (query) => {
  if (query.or.length > 0 && query.or[0].and && query.or[0].and.length > 0) {
    return query;
  }

  return null;
};

const reduceFields = (fields) => flattenTopLevelFields(fields).reduce((reduced, field) => {
  if (typeof fieldTypes[field.type] === 'object') {
    const formattedField = {
      label: field.label,
      value: field.name,
      ...fieldTypes[field.type],
      props: {
        ...field,
      },
    };

    return [
      ...reduced,
      formattedField,
    ];
  }

  return reduced;
}, []);

const WhereBuilder = (props) => {
  const {
    collection,
    collection: {
      slug,
      labels: {
        plural,
      } = {},
    } = {},
    handleChange,
  } = props;

  const [where, dispatchWhere] = useReducer(reducer, []);
  const [reducedFields] = useState(() => reduceFields(collection.fields));

  useThrottledEffect(() => {
    let whereQuery = {
      or: [],
    };

    if (where) {
      whereQuery.or = where.map((or) => or.reduce((conditions, condition) => {
        const { field, operator, value } = condition;
        if (field && operator && value) {
          return {
            and: [
              ...conditions.and,
              {
                [field]: {
                  [operator]: value,
                },
              },
            ],
          };
        }

        return conditions;
      }, {
        and: [],
      }));
    }

    whereQuery = validateWhereQuery(whereQuery);

    if (typeof handleChange === 'function') handleChange(whereQuery);
  }, 500, [where, handleChange]);

  return (
    <div className={baseClass}>
      {where.length > 0 && (
        <React.Fragment>
          <div className={`${baseClass}__label`}>
            Filter
            {' '}
            {plural}
            {' '}
            where
          </div>
          <ul className={`${baseClass}__or-filters`}>
            {where.map((or, orIndex) => (
              <li key={orIndex}>
                {orIndex !== 0 && (
                  <div className={`${baseClass}__label`}>
                    Or
                  </div>
                )}
                <ul className={`${baseClass}__and-filters`}>
                  {or && or.map((_, andIndex) => (
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
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <Button
            className={`${baseClass}__add-or`}
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => dispatchWhere({ type: 'add' })}
          >
            Or
          </Button>
        </React.Fragment>
      )}
      {where.length === 0 && (
        <div className={`${baseClass}__no-filters`}>
          <div className={`${baseClass}__label`}>No filters set</div>
          <Button
            className={`${baseClass}__add-first-filter`}
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            iconStyle="with-border"
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
