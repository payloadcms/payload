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
import { useFormSubmitted } from '../../Form/context';
import { WatchChildErrors } from '../../WatchChildErrors';
import { ErrorPill } from '../../../elements/ErrorPill';

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
  const submitted = useFormSubmitted();
  const [errorCount, setErrorCount] = React.useState(undefined);
  const groupHasErrors = submitted && errorCount > 0;

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
        groupHasErrors && `${baseClass}--has-error`,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <WatchChildErrors
        setErrorCount={setErrorCount}
        path={path}
        fieldSchema={fields}
      />
      <GroupProvider>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__header`}>
            {(label || description) && (
              <header>
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
            {groupHasErrors && (
              <ErrorPill
                count={errorCount}
                withMessage
              />
            )}
          </div>
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
