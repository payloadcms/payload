import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

import './index.scss';

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
      type: 'addAfter',
    });
  }

  function removeRow({ rowIndex }) {
    setInternalRowCount(count => count - 1);
    adjustRows({
      index: rowIndex,
      fieldName: name,
      totalRows: internalRowCount,
      fields,
      type: 'remove',
    });
  }

  const initialRows = defaultOrSavedValue.length > 0 ? defaultOrSavedValue : [{}];
  const iterableInternalRowCount = Array.from(Array(internalRowCount).keys());

  return (
    <div className="field-repeater">
      <Section heading={label}>

        {iterableInternalRowCount.map((_, rowIndex) => {
          return (
            <React.Fragment key={rowIndex}>
              <h2>{`Repeater Item ${rowIndex}`}</h2>

              <RenderFields
                fields={fields.map((field) => {
                  return ({
                    ...field,
                    name: `${name}.${rowIndex}.${field.name}`,
                    defaultValue: initialRows[rowIndex] ? initialRows[rowIndex][field.name] : null,
                  });
                })}
              />

              <button
                onClick={() => addNewRow({ rowIndex })}
                type="button"
              >
                {`Add after ${rowIndex}`}
              </button>
              <button
                onClick={() => removeRow({ rowIndex })}
                type="button"
              >
                {`Remove ${rowIndex}`}
              </button>
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
