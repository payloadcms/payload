import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';


import './index.scss';

const baseClass = 'condition';

const Condition = (props) => {
  const {
    fields,
    dispatch,
    value,
    orIndex,
    andIndex,
  } = props;

  const [activeOperators, setActiveOperators] = useState([]);

  useEffect(() => {

  }, [value]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              value={value.field}
              options={fields}
              onChange={newField => console.log('changing field', newField)}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              value={value.field}
              options={activeOperators}
              onChange={() => console.log('changing')}
            />
          </div>
          <div className={`${baseClass}__value`}>
            <ReactSelect
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
              payload: {
                orIndex,
                andIndex,
              },
            })}
          />
          <Button
            icon="plus"
            round
            buttonStyle="icon-label"
            onClick={() => dispatch({
              type: 'add',
              payload: {
                relation: 'and',
                orIndex,
                andIndex: andIndex + 1,
              },
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
      name: PropTypes.string,
      type: PropTypes.string,
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
