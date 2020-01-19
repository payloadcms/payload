import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

const RenderFields = ({ fields }) => {
  if (fields) {
    return fields.map((field, i) => {
      return field.name + i;
    });
  }

  return null;
};

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

export default RenderFields;
