import React from 'react';
import RenderFields from '../../RenderFields.js';
import withCondition from '../../withCondition.js';
import { Props } from './types.js';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath.js';
import { RowProvider } from './provider.js';

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
    <RowProvider>
      <RenderFields
        readOnly={readOnly}
        className={classes}
        permissions={permissions}
        fieldTypes={fieldTypes}
        indexPath={indexPath}
        fieldSchema={fields.map((field) => ({
          ...field,
          path: createNestedFieldPath(path, field),
        }))}
      />
    </RowProvider>
  );
};
export default withCondition(Row);
