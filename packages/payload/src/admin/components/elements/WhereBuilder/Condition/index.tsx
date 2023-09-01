import React, { useEffect, useState } from 'react';

import type { FieldCondition } from '../types';
import type { Props } from './types';

import useDebounce from '../../../../hooks/useDebounce';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import Button from '../../Button';
import ReactSelect from '../../ReactSelect';
import Date from './Date';
import Number from './Number';
import Relationship from './Relationship';
import { Select } from './Select';
import Text from './Text';
import './index.scss';

const valueFields = {
  Date,
  Number,
  Relationship,
  Select,
  Text,
};

const baseClass = 'condition';

const Condition: React.FC<Props> = (props) => {
  const {
    andIndex,
    dispatch,
    fields,
    orIndex,
    value,
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
      andIndex,
      orIndex,
      type: 'update',
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
              onChange={(field) => dispatch({
                andIndex,
                field: field.value,
                orIndex,
                type: 'update',
              })}
              options={fields}
              value={fields.find((field) => fieldValue === field.value)}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              onChange={(operator) => {
                dispatch({
                  andIndex,
                  operator: operator.value,
                  orIndex,
                  type: 'update',
                });
              }}
              disabled={!fieldValue}
              options={activeField.operators}
              value={activeField.operators.find((operator) => operatorValue === operator.value)}
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomComponent
              componentProps={{
                ...activeField?.props,
                onChange: setInternalValue,
                operator: operatorValue,
                options: selectOptions,
                value: internalValue,
              }}
              CustomComponent={activeField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
            />
          </div>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            onClick={() => dispatch({
              andIndex,
              orIndex,
              type: 'remove',
            })}
            buttonStyle="icon-label"
            className={`${baseClass}__actions-remove`}
            icon="x"
            iconStyle="with-border"
            round
          />
          <Button
            onClick={() => dispatch({
              andIndex: andIndex + 1,
              field: fields[0].value,
              orIndex,
              relation: 'and',
              type: 'add',
            })}
            buttonStyle="icon-label"
            className={`${baseClass}__actions-add`}
            icon="plus"
            iconStyle="with-border"
            round
          />
        </div>
      </div>
    </div>
  );
};

export default Condition;
