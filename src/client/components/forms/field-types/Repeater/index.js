import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

const formatSubField = (parentName, subField, i) => {
  const formatted = {
    ...subField,
    name: `${parentName}[${i}]${subField.name}`
  };

  return formatted;
};

const Repeater = (props) => {
  const { label, fields, name } = props;

  return (
    <div className="field-repeater">
      <Section heading={label}>
        <RenderFields
          fields={fields}
          formatter={(field, i) => formatSubField(name, field, i)}
        />
      </Section>
    </div>
  );
};

Repeater.defaultProps = {
  label: '',
};

Repeater.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default Repeater;
