import React from 'react';
import PropTypes from 'prop-types';
import RenderFields, { useRenderedFields } from '../../RenderFields';
import withCondition from '../../withCondition';

import './index.scss';

const Group = (props) => {
  const {
    label, fields, name, path, defaultValue, fieldTypes,
  } = props;

  const { customComponentsPath } = useRenderedFields();

  return (
    <div className="field-type group">
      <h3>{label}</h3>
      <RenderFields
        initialData={defaultValue}
        fieldTypes={fieldTypes}
        customComponentsPath={`${customComponentsPath}${name}.fields.`}
        fieldSchema={fields.map((subField) => {
          return {
            ...subField,
            path: `${path}${subField.name ? `.${subField.name}` : ''}`,
          };
        })}
      />
    </div>
  );
};

Group.defaultProps = {
  label: '',
  defaultValue: {},
};

Group.propTypes = {
  defaultValue: PropTypes.shape({}),
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default withCondition(Group);
