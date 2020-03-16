import React, { useState, useContext, useEffect } from 'react';
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
  const formContext = useContext(FormContext);
  const { adjustRows } = formContext;

  const {
    label,
    name,
    defaultValue: defaultOrSavedValue,
    fields,
  } = props;

  const [internalRowCount, setInternalRowCount] = useState(1);
  useEffect(() => { setInternalRowCount(defaultOrSavedValue.length); }, [defaultOrSavedValue]);

  function addNewRow({ rowIndex }) {
    setInternalRowCount(count => count + 1);
    adjustRows({
      index: rowIndex + 1,
      fieldName: name,
      totalRows: internalRowCount,
      fields,
      adjustmentType: 'addAfter',
    });
  }

  function removeRow({ rowIndex }) {
    setInternalRowCount(count => count - 1);
    adjustRows({
      index: rowIndex,
      fieldName: name,
      totalRows: internalRowCount,
      fields,
      adjustmentType: 'remove',
    });
  }

  const initialRows = defaultOrSavedValue.length > 0 ? defaultOrSavedValue : [{}];
  const iterableInternalRowCount = Array.from(Array(internalRowCount).keys());

  return (
    <div className={baseClass}>
      <Section
        heading={label}
        className="repeater"
      >

        {iterableInternalRowCount.length === 0
          && (
            <RepeatFieldButton onClick={() => addNewRow({ rowIndex: 0 })} />
          )}
        {iterableInternalRowCount.map((_, rowIndex) => {
          return (
            <React.Fragment key={rowIndex}>
              <div className={`${baseClass}__section-inner`}>
                <Button
                  className="delete"
                  onClick={() => removeRow({ rowIndex })}
                  type="error"
                >
                  <X />
                </Button>
                <h2>{`${label} - Item ${rowIndex}`}</h2>

                <RenderFields
                  fields={fields.map((field) => {
                    return ({
                      ...field,
                      name: `${name}.${rowIndex}.${field.name}`,
                      defaultValue: initialRows[rowIndex] ? initialRows[rowIndex][field.name] : null,
                    });
                  })}
                />
              </div>

              <RepeatFieldButton onClick={() => addNewRow({ rowIndex })} />
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
