import React, { useCallback, useEffect, useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { Collapsible } from '../../../elements/Collapsible';
import { usePreferences } from '../../../utilities/Preferences';
import { DocumentPreferences } from '../../../../../preferences/types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import FieldDescription from '../../FieldDescription';
import { RowLabel } from '../../RowLabel';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath';
import { WatchChildErrors } from '../../WatchChildErrors';
import { useFormSubmitted } from '../../Form/context';
import { ErrorPill } from '../../../elements/ErrorPill';

import './index.scss';

const baseClass = 'collapsible-field';

const CollapsibleField: React.FC<Props> = (props) => {
  const {
    label,
    fields,
    fieldTypes,
    path,
    permissions,
    indexPath,
    admin: {
      readOnly,
      className,
      initCollapsed,
      description,
    },
  } = props;

  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>();
  const fieldPreferencesKey = `collapsible-${indexPath.replace(/\./gi, '__')}`;
  const [errorCount, setErrorCount] = useState(0);
  const submitted = useFormSubmitted();

  const onToggle = useCallback(async (newCollapsedState: boolean) => {
    const existingPreferences: DocumentPreferences = await getPreference(preferencesKey);

    setPreference(preferencesKey, {
      ...existingPreferences,
      ...path ? {
        fields: {
          ...existingPreferences?.fields || {},
          [path]: {
            ...existingPreferences?.fields?.[path],
            collapsed: newCollapsedState,
          },
        },
      } : {
        fields: {
          ...existingPreferences?.fields || {},
          [fieldPreferencesKey]: {
            ...existingPreferences?.fields?.[fieldPreferencesKey],
            collapsed: newCollapsedState,
          },
        },
      },
    });
  }, [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path]);

  useEffect(() => {
    const fetchInitialState = async () => {
      const preferences = await getPreference(preferencesKey);
      if (preferences) {
        const initCollapsedFromPref = path ? preferences?.fields?.[path]?.collapsed : preferences?.fields?.[fieldPreferencesKey]?.collapsed;
        setCollapsedOnMount(Boolean(initCollapsedFromPref));
      } else {
        setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false);
      }
    };

    fetchInitialState();
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path]);

  if (typeof collapsedOnMount !== 'boolean') return null;

  const fieldHasErrors = submitted && errorCount > 0;

  const classes = [
    'field-type',
    baseClass,
    className,
    fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
  ].filter(Boolean).join(' ');

  return (
    <div id={`field-${fieldPreferencesKey}${path ? `-${path.replace(/\./gi, '__')}` : ''}`}>
      <WatchChildErrors
        setErrorCount={setErrorCount}
        path={path}
        fieldSchema={fields}
      />
      <Collapsible
        initCollapsed={collapsedOnMount}
        className={classes}
        collapsibleStyle={errorCount > 0 ? 'error' : 'default'}
        header={(
          <div className={`${baseClass}__row-label-wrap`}>
            <RowLabel
              path={path}
              label={label}
            />
            {errorCount > 0 && (
              <ErrorPill
                count={errorCount}
                withMessage
              />
            )}
          </div>
        )}
        onToggle={onToggle}
      >
        <RenderFields
          forceRender
          readOnly={readOnly}
          permissions={permissions}
          fieldTypes={fieldTypes}
          indexPath={indexPath}
          fieldSchema={fields.map((field) => ({
            ...field,
            path: createNestedFieldPath(path, field),
          }))}
        />
      </Collapsible>
      <FieldDescription
        description={description}
      />
    </div>
  );
};

export default withCondition(CollapsibleField);
