import React from 'react';
import PropTypes from 'prop-types';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';

import './index.scss';

const Row = (props) => {
  const {
    fields, fieldTypes, path, permissions,
  } = props;

  return (
    <RenderFields
      className="field-type row"
      permissions={permissions}
      fieldTypes={fieldTypes}
      fieldSchema={fields.map((field) => ({
        ...field,
        path: `${path ? `${path}.` : ''}${field.name}`,
      }))}
    />
  );
};

Row.defaultProps = {
  path: '',
  permissions: {},
};

Row.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  path: PropTypes.string,
  permissions: PropTypes.shape({}),
};

export default withCondition(Row);
