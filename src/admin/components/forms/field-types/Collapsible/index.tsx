import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';
import { Collapsible } from '../../../elements/Collapsible';

import './index.scss';

const baseClass = 'collapsible-field';

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    label,
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
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Collapsible
      className={classes}
      header={<div className={`${baseClass}__label`}>{label}</div>}
    >
      <RenderFields
        readOnly={readOnly}
        permissions={permissions?.fields}
        fieldTypes={fieldTypes}
        fieldSchema={fields.map((field) => ({
          ...field,
          path: `${path ? `${path}.` : ''}${fieldAffectsData(field) ? field.name : ''}`,
        }))}
      />
    </Collapsible>
  );
};

export default withCondition(CollapsibleField);
