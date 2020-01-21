import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

import './index.scss';

const RenderFields = ({ fields }) => {
  if (fields) {
    return (
      <>
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

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

export default RenderFields;
