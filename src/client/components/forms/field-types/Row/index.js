import React from 'react';
import PropTypes from 'prop-types';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';

import './index.scss';

const Row = (props) => {
  const {
    fields, fieldTypes, initialData, path: pathFromProps, name,
  } = props;

  const path = pathFromProps || name;

  return (
    <div className="field-type row">
      <RenderFields
        initialData={initialData}
        fieldTypes={fieldTypes}
        fieldSchema={fields.map((field) => {
          return {
            ...field,
            path: `${path ? `${path}.` : ''}${field.name}`,
          };
        })}
      />
    </div>
  );
};

Row.defaultProps = {
  path: '',
  initialData: undefined,
};

Row.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  initialData: PropTypes.shape({}),
};

export default withCondition(Row);
