import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../ReactSelect';
import Button from '../../Button';


import './index.scss';

const baseClass = 'condition';

const Condition = (props) => {
  const {
    fields,
    operators,
    handleChange,
    value,
  } = props;

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              options={fields}
              onChange={newField => console.log('changing field', newField)}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              options={operators}
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
            onClick={() => console.log('remove')}
          />
          <Button
            icon="plus"
            round
            buttonStyle="icon-label"
            onClick={() => console.log('add')}
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
  handleChange: PropTypes.func.isRequired,
};

export default Condition;
