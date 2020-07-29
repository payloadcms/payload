import React from 'react';
import PropTypes from 'prop-types';
import RenderFields, { useRenderedFields } from '../../RenderFields';
import withCondition from '../../withCondition';
import FieldTypeGutter from '../../FieldTypeGutter';

import './index.scss';

const baseClass = 'group';

const Group = (props) => {
  const {
    label, fields, name, path: pathFromProps, fieldTypes,
  } = props;

  const path = pathFromProps || name;

  const { customComponentsPath } = useRenderedFields();

  return (
    <div className="field-type group">
      <FieldTypeGutter />

      <div className={`${baseClass}__content-wrapper`}>
        <h3 className={`${baseClass}__title`}>{label}</h3>

        <div className={`${baseClass}__fields-wrapper`}>
          <RenderFields
            fieldTypes={fieldTypes}
            customComponentsPath={`${customComponentsPath}${name}.fields.`}
            fieldSchema={fields.map((subField) => ({
              ...subField,
              path: `${path}${subField.name ? `.${subField.name}` : ''}`,
            }))}
          />
        </div>
      </div>
    </div>
  );
};

Group.defaultProps = {
  label: '',
  path: '',
};

Group.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default withCondition(Group);
