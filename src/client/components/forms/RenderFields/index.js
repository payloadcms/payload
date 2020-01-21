import React from 'react';
import PropTypes from 'prop-types';
import fieldTypes from '../field-types';

import './index.scss';

const RenderFields = ({ fields, formatter }) => {
  if (fields) {
    return (
      <>
        {fields.map((field, i) => {
          const FieldComponent = field.component || fieldTypes[field.type];
          const formattedField = (formatter && typeof formatter === 'function') ? formatter(field, i) : field;

          if (FieldComponent) {
            return (
              <FieldComponent
                key={i}
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
};

RenderFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  formatter: PropTypes.func,
};

export default RenderFields;
