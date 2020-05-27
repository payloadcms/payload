import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';
import Date from './Date';
import Number from './Number';
import Text from './Text';

import './index.scss';

const valueFields = {
  Date,
  Number,
  Text,
};

const baseClass = 'condition';

const Condition = (props) => {
  const {
    fields,
    dispatch,
    value,
    orIndex,
    andIndex,
  } = props;

  const [activeField, setActiveField] = useState({ operators: [] });

  useEffect(() => {
    const newActiveField = fields.find(field => value.field === field.value);

    if (newActiveField) {
      setActiveField(newActiveField);
    }
  }, [value, fields]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              value={fields.find(field => value.field === field.value)}
              options={fields}
              onChange={field => dispatch({
                type: 'update',
                orIndex,
                andIndex,
                field,
              })}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              value={activeField.operators.find(operator => value.operator === operator.value)}
              options={activeField.operators}
              onChange={operator => dispatch({
                type: 'update',
                orIndex,
                andIndex,
                operator,
              })}
            />
          </div>
          <div className={`${baseClass}__value`}>
            <ReactSelect
              value={value.value}
              options={[
                {
                  label: 'Option 1',
                  value: 'option-1',
                },
              ]}
              onChange={newValue => console.log('changing value', newValue)}
            />
          </div>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            onClick={() => dispatch({
              type: 'remove',
              orIndex,
              andIndex,
            })}
          />
          <Button
            icon="plus"
            round
            buttonStyle="icon-label"
            onClick={() => dispatch({
              type: 'add',
              relation: 'and',
              orIndex,
              andIndex: andIndex + 1,
            })}
          />
        </div>
      </div>
    </div>
  );
};

Condition.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
      operators: PropTypes.arrayOf(
        PropTypes.shape({}),
      ),
    }),
  ).isRequired,
  value: PropTypes.shape({
    field: PropTypes.string,
    operator: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  orIndex: PropTypes.number.isRequired,
  andIndex: PropTypes.number.isRequired,
};

export default Condition;
