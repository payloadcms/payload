import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';
import RepeatFieldButton from '../../../controls/RepeatFieldButton';
import Button from '../../../controls/Button';
import X from '../../../graphics/X';

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

  const addNewRow = (rowIndex) => {
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

        {rowCount === 0
          && (
            <RepeatFieldButton onClick={() => addNewRow(0)} />
          )}
        {Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
          return (
            <React.Fragment key={rowIndex}>
              <div className={`${baseClass}__section-inner`}>
                <Button
                  className="delete"
                  onClick={() => removeRow(rowIndex)}
                  type="error"
                >
                  <X />
                </Button>
                <h2>{`${label} - Item ${rowIndex}`}</h2>

                <RenderFields
                  fields={fields.map((field) => {
                    const fieldName = `${name}.${rowIndex}.${field.name}`;
                    return ({
                      ...field,
                      name: fieldName,
                      defaultValue: fieldState?.[fieldName]?.value,
                    });
                  })}
                />
              </div>

              <RepeatFieldButton onClick={() => addNewRow(rowIndex)} />
            </React.Fragment>
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
