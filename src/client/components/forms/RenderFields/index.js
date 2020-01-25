import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

import './index.scss';

const RenderFields = ({ fields, formatter, initialData }) => {
  if (fields) {
    return (
      <>
        {fields.map((field, i) => {
          const { defaultValue } = field;
          const FieldComponent = field.component || fieldTypes[field.type];
          const formattedField = (formatter && typeof formatter === 'function') ? formatter(field, i) : {};

          if (FieldComponent) {
            return (
              <FieldComponent
                key={i}
                {...field}
                defaultValue={defaultValue || initialData[field.name]}
                {...formattedField}
              />
            );
          }

          return (
            <div
              className="missing-field"
              key={i}
            >
              No matched field found for
              {' '}
              &quot;
              {field.label}
              &quot;
            </div>
          );
        })}
      </>
    );
  }

  return null;
};

RenderFields.defaultProps = {
  formatter: null,
  initialData: {},
};

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  formatter: PropTypes.func,
  initialData: PropTypes.shape({}),
};

export default RenderFields;
