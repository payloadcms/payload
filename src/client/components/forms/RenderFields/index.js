import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const RenderFields = ({
  fieldSchema, initialData, customComponents, fieldTypes, filter,
}) => {
  if (fieldSchema) {
    return (
      <>
        {fieldSchema.map((field, i) => {
          const { defaultValue } = field;
          if (field?.hidden !== 'api' && field?.hidden !== true) {
            if ((filter && typeof filter === 'function' && filter(field)) || !filter) {
              let FieldComponent = field?.hidden === 'admin' ? fieldTypes.hidden : fieldTypes[field.type];

              if (customComponents?.[field.name]?.field) {
                FieldComponent = customComponents[field.name].field;
              }

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
            }

            return null;
          }

          return null;
        })}
      </>
    );
  }

  return null;
};

RenderFields.defaultProps = {
  initialData: {},
  customComponents: {},
  filter: null,
};

RenderFields.propTypes = {
  fieldSchema: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  initialData: PropTypes.shape({}),
  customComponents: PropTypes.shape({}),
  fieldTypes: PropTypes.shape({
    hidden: PropTypes.func,
  }).isRequired,
  filter: PropTypes.func,
};

export default RenderFields;
