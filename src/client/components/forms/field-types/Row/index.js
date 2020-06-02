import React from 'react';
import PropTypes from 'prop-types';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';

import './index.scss';

const Row = (props) => {
  const {
    fields, fieldTypes, name, defaultValue,
  } = props;

  return (
    <div className="field-type row">
      <RenderFields
        fieldTypes={fieldTypes}
        fieldSchema={fields.map((field) => {
          return {
            ...field,
            name: `${name ? `${name}.` : ''}${field.name}`,
            defaultValue: defaultValue ? defaultValue[field.name] : null,
          };
        })}
      />
    </div>
  );
};

Row.defaultProps = {
  name: '',
  defaultValue: null,
};

Row.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  name: PropTypes.string,
  defaultValue: PropTypes.shape({}),
};

export default withCondition(Row);
