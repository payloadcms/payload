import React from 'react';
import PropTypes from 'prop-types';
import RenderFields, { useRenderedFields } from '../../RenderFields';
import withCondition from '../../withCondition';
import SubForm from '../../SubForm';

import './index.scss';

const Group = (props) => {
  const {
    label, fields, name, path: pathFromProps, fieldTypes, initialData,
  } = props;

  const path = pathFromProps || name;

  const { customComponentsPath } = useRenderedFields();

  return (
    <div className="field-type group">
      <h3>{label}</h3>
      <RenderFields
        initialData={initialData}
        fieldTypes={fieldTypes}
        customComponentsPath={`${customComponentsPath}${name}.fields.`}
        fieldSchema={fields.map((subField) => ({
          ...subField,
          path: `${path}${subField.name ? `.${subField.name}` : ''}`,
        }))}
      />
    </div>
  );
};

Group.defaultProps = {
  label: '',
  initialData: {},
  path: '',
};

Group.propTypes = {
  initialData: PropTypes.shape({}),
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  fieldTypes: PropTypes.shape({}).isRequired,
};

const GroupForm = (props) => {
  const { name, path } = props;

  return (
    <SubForm {...{ name, path }}>
      <Group {...props} />
    </SubForm>
  );
};

GroupForm.defaultProps = {
  path: '',
};

GroupForm.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default withCondition(GroupForm);
