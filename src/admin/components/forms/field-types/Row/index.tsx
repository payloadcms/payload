import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';

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
      permissions={permissions?.fields}
      fieldTypes={fieldTypes}
      fieldSchema={fields.map((field) => ({
        ...field,
        path: `${path ? `${path}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
      }))}
    />
  );
};
export default withCondition(Row);
