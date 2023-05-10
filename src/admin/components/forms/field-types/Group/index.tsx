import React from 'react';
import { useTranslation } from 'react-i18next';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { useCollapsible } from '../../../elements/Collapsible/provider';
import { GroupProvider, useGroup } from './provider';
import { useRow } from '../Row/provider';
import { useTabs } from '../Tabs/provider';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath';

import './index.scss';

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
  const isWithinRow = useRow();
  const isWithinTab = useTabs();
  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  return (
    <div
      id={`field-${path.replace(/\./gi, '__')}`}
      className={[
        'field-type',
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        isWithinGroup && `${baseClass}--within-group`,
        isWithinRow && `${baseClass}--within-row`,
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
                <h3 className={`${baseClass}__title`}>{getTranslation(label, i18n)}</h3>
              )}
              <FieldDescription
                className={`field-description-${path.replace(/\./gi, '__')}`}
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
              path: createNestedFieldPath(path, subField),
            }))}
          />
        </div>
      </GroupProvider>
    </div>
  );
};

export default withCondition(Group);
