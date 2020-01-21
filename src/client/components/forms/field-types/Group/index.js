import React from 'react';
import PropTypes from 'prop-types';
import Section from '../../../layout/Section';
import RenderFields from '../../RenderFields';

import './index.scss';

const formatSubField = (parentName, subField) => {
  const formatted = {
    ...subField,
    name: `${parentName}.${subField.name}`
  };

  return formatted;
};

const Group = (props) => {
  const { label, fields, name } = props;

  return (
    <Section
      heading={label}
      className="field-group"
    >
      <RenderFields
        fields={fields}
        formatter={(field) => formatSubField(name, field)}
      />
    </Section>
  );
};

Group.defaultProps = {
  label: '',
};

Group.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default Group;
