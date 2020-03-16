import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

import './index.scss';

const RenderFields = ({ fields, initialData, customComponents }) => {
  if (fields) {
    return (
      <>
        {fields.map((field, i) => {
          const { defaultValue } = field;
          const FieldComponent = customComponents?.[field.name] || fieldTypes[field.type];

          if (FieldComponent) {
            return (
              <FieldComponent
                key={i}
                {...field}
                defaultValue={initialData[field.name] || defaultValue}
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
  initialData: {},
  customComponents: {},
};

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  initialData: PropTypes.shape({}),
  customComponents: PropTypes.shape({}),
};

export default RenderFields;
