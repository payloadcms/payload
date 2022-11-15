import React from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { fieldAffectsData } from '../../../../../fields/config/types';
import { useCollapsible } from '../../../elements/Collapsible/provider';

import './index.scss';
import { GroupProvider, useGroup } from './provider';
import { useTabs } from '../Tabs/provider';

const baseClass = 'group-field';

const Group: React.FC<Props> = (props) => {
  const {
    label,
    fields,
    name,
    path: pathFromProps,
    fieldTypes,
    indexPath,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      hideGutter = false,
    },
    permissions,
  } = props;

  const isWithinCollapsible = useCollapsible();
  const isWithinGroup = useGroup();
  const isWithinTab = useTabs();

  const path = pathFromProps || name;

  return (
    <div
      id={`field-${path.replace(/\./gi, '__')}`}
      className={[
        'field-type',
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        isWithinGroup && `${baseClass}--within-group`,
        isWithinTab && `${baseClass}--within-tab`,
        (!hideGutter && isWithinGroup) && `${baseClass}--gutter`,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <GroupProvider>
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
            indexPath={indexPath}
            fieldSchema={fields.map((subField) => ({
              ...subField,
              path: `${path}${fieldAffectsData(subField) ? `.${subField.name}` : ''}`,
            }))}
          />
        </div>
      </GroupProvider>
    </div>
  );
};

export default withCondition(Group);
