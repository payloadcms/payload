import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { getFieldPath } from '../getFieldPath';

import './index.scss';

const Row: React.FC<Props> = (props) => {
  const {
    fields,
    fieldTypes,
    path,
    permissions,
    admin: {
      readOnly,
      className,
    },
    indexPath,
  } = props;

  const classes = [
    'field-type',
    'row',
    className,
  ].filter(Boolean).join(' ');

  return (
    <RenderFields
      readOnly={readOnly}
      className={classes}
      permissions={permissions}
      fieldTypes={fieldTypes}
      indexPath={indexPath}
      fieldSchema={fields.map((field) => ({
        ...field,
        path: getFieldPath(path, field),
      }))}
    />
  );
};
export default withCondition(Row);
