import React, { useState, useEffect } from 'react';
import { Props } from './types';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';
import Date from './Date';
import Number from './Number';
import Text from './Text';
import Relationship from './Relationship';
import { Select } from './Select';
import useDebounce from '../../../../hooks/useDebounce';
import { FieldCondition } from '../types';

import './index.scss';

const valueFields = {
  Date,
  Number,
  Text,
  Relationship,
  Select,
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
  const fieldValue = Object.keys(value)[0];
  const operatorAndValue = value?.[fieldValue] ? Object.entries(value[fieldValue])[0] : undefined;

  const operatorValue = operatorAndValue?.[0];
  const queryValue = operatorAndValue?.[1];

  const [activeField, setActiveField] = useState<FieldCondition>(() => fields.find((field) => fieldValue === field.value));
  const [internalValue, setInternalValue] = useState(queryValue);
  const debouncedValue = useDebounce(internalValue, 300);

  useEffect(() => {
    const newActiveField = fields.find((field) => fieldValue === field.value);

    if (newActiveField) {
      setActiveField(newActiveField);
    }
  }, [fieldValue, fields]);

  useEffect(() => {
    dispatch({
      type: 'update',
      orIndex,
      andIndex,
      value: debouncedValue || '',
    });
  }, [debouncedValue, dispatch, orIndex, andIndex]);

  const booleanSelect = ['exists'].includes(operatorValue) || activeField.props.type === 'checkbox';
  const ValueComponent = booleanSelect ? Select : (valueFields[activeField?.component] || valueFields.Text);

  let selectOptions;
  if (booleanSelect) {
    selectOptions = ['true', 'false'];
  } else if ('options' in activeField?.props) {
    selectOptions = activeField.props.options;
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              value={fields.find((field) => fieldValue === field.value)}
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
              disabled={!fieldValue}
              value={activeField.operators.find((operator) => operatorValue === operator.value)}
              options={activeField.operators}
              onChange={(operator) => {
                dispatch({
                  type: 'update',
                  orIndex,
                  andIndex,
                  operator: operator.value,
                });
              }}
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomComponent
              CustomComponent={activeField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
              componentProps={{
                ...activeField?.props,
                options: selectOptions,
                operator: operatorValue,
                value: internalValue,
                onChange: setInternalValue,
              }}
            />
          </div>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            icon="x"
            className={`${baseClass}__actions-remove`}
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
            className={`${baseClass}__actions-add`}
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
            onClick={() => dispatch({
              type: 'add',
              field: fields[0].value,
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
