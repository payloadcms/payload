import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RepeaterSection from './RepeaterSection'; // eslint-disable-line import/no-cycle

import './index.scss';

const baseClass = 'field-repeater';

const Repeater = (props) => {
  const [rowCount, setRowCount] = useState(0);
  const formContext = useContext(FormContext);
  const { fields: fieldState, dispatchFields } = formContext;

  const {
    label,
    name,
    fields,
    defaultValue,
  } = props;

  const addRow = (rowIndex) => {
    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fields,
    });

    setRowCount(rowCount + 1);
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, name, fields,
    });

    setRowCount(rowCount - 1);
  };

  useEffect(() => {
    setRowCount(defaultValue.length);
  }, [defaultValue]);

  return (
    <div className={baseClass}>
      <Section
        heading={label}
        className="repeater"
      >
        {rowCount > 0 && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
          return (
            <RepeaterSection
              key={rowIndex}
              addRow={() => addRow(rowIndex)}
              removeRow={() => removeRow(rowIndex)}
              rowIndex={rowIndex}
              fieldState={fieldState}
              fields={fields}
              parentName={name}
            />
          );
        })}

      </Section>
    </div>
  );
};

Repeater.defaultProps = {
  label: '',
  defaultValue: [],
};

Repeater.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default Repeater;
