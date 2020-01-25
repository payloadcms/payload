import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

const Repeater = (props) => {
  const {
    label, fields, name, defaultValue,
  } = props;

  let rows = defaultValue.length > 0 ? defaultValue : [{}];

  return (
    <div className="field-repeater">
      <Section heading={label}>
        {rows.map((row, i) => {
          return (
            <RenderFields
              key={i}
              fields={fields.map((subField) => ({
                ...subField,
                name: `${name}[${i}][${subField.name}]`,
                defaultValue: row[subField.name] || null,
              }))}
            />
          )
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
