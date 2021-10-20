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
    },
  } = props;

  return (
    <RenderFields
      readOnly={readOnly}
      className="field-type row"
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
