import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

import './index.scss';

const baseClass = 'render-fields';

const RenderFields = ({ fields }) => {
  if (fields) {
    return (
      <div className={baseClass}>
        {fields.map((field, i) => {
          const FieldComponent = field.component || fieldTypes[field.type];

          if (FieldComponent) {
            return (
              <FieldComponent
                key={i}
                {...field}
              />
            );
          }

          return (
            <div
              className={`${baseClass}__no-field-found`}
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
      </div>
    );
  }

  return null;
};

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

export default RenderFields;
