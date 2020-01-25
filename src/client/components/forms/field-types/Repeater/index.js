import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

const Repeater = (props) => {
  const {
    label, fields, name, defaultValue,
  } = props;

  return (
    <div className="field-repeater">
      <Section heading={label}>
        <RenderFields
          fields={fields.map((subField, i) => {
            let defaultSubValue = null;
            const subFieldName = `${name}[${i}][${subField.name}]`;

            if (defaultValue[i] && defaultValue[i][subField.name]) {
              defaultSubValue = defaultValue[i][subField.name];
            }

            return {
              ...subField,
              name: subFieldName,
              defaultValue: defaultSubValue,
            };
          })}
        />
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
