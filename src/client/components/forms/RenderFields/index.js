import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const RenderFields = ({
  fieldSchema, initialData, customComponents, fieldTypes,
}) => {
  if (fieldSchema) {
    return (
      <>
        {fieldSchema.map((field, i) => {
          const { defaultValue } = field;
          const FieldComponent = customComponents?.[field.name]?.field || fieldTypes[field.type];

          if (FieldComponent) {
            return (
              <FieldComponent
                fieldTypes={fieldTypes}
                key={field.name}
                {...field}
                validate={field.validate ? value => field.validate(value, field) : undefined}
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
  fieldSchema: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  initialData: PropTypes.shape({}),
  customComponents: PropTypes.shape({}),
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default RenderFields;
