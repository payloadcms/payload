import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';
import { useCollapsible } from '../../../elements/Collapsible/provider';

import './index.scss';

const baseClass = 'group-field';

const Group: React.FC<Props> = (props) => {
  const {
    label,
    fields,
    name,
    path: pathFromProps,
    fieldTypes,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
    },
    permissions,
  } = props;

  const isWithinCollapsible = useCollapsible();

  const path = pathFromProps || name;

  return (
    <div
      id={`field-${path}`}
      className={[
        'field-type',
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        {(label || description) && (
          <header className={`${baseClass}__header`}>
            {label && (
              <h3 className={`${baseClass}__title`}>{label}</h3>
            )}
            <FieldDescription
              value={null}
              description={description}
            />
          </header>
        )}
        <RenderFields
          permissions={permissions?.fields}
          readOnly={readOnly}
          fieldTypes={fieldTypes}
          fieldSchema={fields.map((subField) => ({
            ...subField,
            path: `${path}${fieldAffectsData(subField) ? `.${subField.name}` : ''}`,
          }))}
        />
      </div>
    </div>
  );
};

export default withCondition(Group);
