import React, { useContext } from 'react';
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
  const { dispatchFields } = formContext;

  const {
    label,
    name,
    defaultValue: defaultOrSavedValue,
    fields,
  } = props;

  const addNewRow = rowIndex => dispatchFields({ type: 'ADD_ROW', payload: { rowIndex, name } });
  const removeRow = rowIndex => dispatchFields({ type: 'REMOVE_ROW', payload: { rowIndex, name } });

  const rows = defaultOrSavedValue.length > 0 ? defaultOrSavedValue : [];

  return (
    <div className={baseClass}>
      <Section
        heading={label}
        className="repeater"
      >

        {rows.length === 0
          && (
            <RepeatFieldButton onClick={() => addNewRow(0)} />
          )}
        {rows.map((_, rowIndex) => {
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
                    return ({
                      ...field,
                      name: `${name}.${rowIndex}.${field.name}`,
                      defaultValue: initialRows[rowIndex] ? initialRows[rowIndex][field.name] : null,
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
