import React, { useState, useEffect } from 'react';
import { Props } from './types';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';
import Date from './Date';
import Number from './Number';
import Text from './Text';
import useDebounce from '../../../../hooks/useDebounce';
import { FieldCondition } from '../types';

import './index.scss';

const valueFields = {
  Date,
  Number,
  Text,
};

const baseClass = 'condition';

const Condition: React.FC<Props> = (props) => {
  const {
    fields,
    dispatch,
    value,
    orIndex,
    andIndex,
  } = props;

  const [activeField, setActiveField] = useState({ operators: [] } as FieldCondition);
  const [internalValue, setInternalValue] = useState(value.value);
  const debouncedValue = useDebounce(internalValue, 300);

  useEffect(() => {
    const newActiveField = fields.find((field) => value.field === field.value);

    if (newActiveField) {
      setActiveField(newActiveField);
    }
  }, [value, fields]);

  useEffect(() => {
    dispatch({
      type: 'update',
      orIndex,
      andIndex,
      value: debouncedValue || '',
    });
  }, [debouncedValue, dispatch, orIndex, andIndex]);

  const ValueComponent = valueFields[activeField.component] || valueFields.Text;

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              value={fields.find((field) => value.field === field.value)}
              options={fields}
              onChange={(field) => dispatch({
                type: 'update',
                orIndex,
                andIndex,
                field: field.value,
              })}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              value={activeField.operators.find((operator) => value.operator === operator.value)}
              options={activeField.operators}
              onChange={(operator) => dispatch({
                type: 'update',
                orIndex,
                andIndex,
                operator: operator.value,
              })}
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomComponent
              CustomComponent={activeField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
              componentProps={{
                ...activeField.props,
                value: internalValue,
                onChange: setInternalValue,
              }}
            />
          </div>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
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
            iconStyle="with-border"
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

export default Condition;
