import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';
import IconButton from '../../../controls/IconButton';
import Pill from '../../../modules/Pill';

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
        {Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
          return (
            <React.Fragment key={rowIndex}>
              <div className={`${baseClass}__section`}>
                <div className={`${baseClass}__section-header`}>
                  <Pill>
                    {name}
                  </Pill>
                  <h4 className={`${baseClass}__section-header__heading`}>Title Goes Here</h4>

                  <div className={`${baseClass}__section-header__controls`}>
                    <IconButton
                      iconName="crosshair"
                      onClick={() => addRow(rowIndex)}
                      size="small"
                    />

                    <IconButton
                      iconName="crossOut"
                      onClick={() => removeRow(rowIndex)}
                      size="small"
                    />

                    <IconButton
                      iconName="arrow"
                      // onClick={() => removeRow(rowIndex)}
                      size="small"
                    />
                  </div>
                </div>

                <div className={`${baseClass}__section-content`}>
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
              </div>
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
