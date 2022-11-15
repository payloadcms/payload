import React, { useCallback, useEffect, useState } from 'react';
import RenderFields from '../../RenderFields';
import withCondition from '../../withCondition';
import { Props } from './types';
import { Collapsible } from '../../../elements/Collapsible';
import toKebabCase from '../../../../../utilities/toKebabCase';
import { usePreferences } from '../../../utilities/Preferences';
import { DocumentPreferences } from '../../../../../preferences/types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import FieldDescription from '../../FieldDescription';
import { getFieldPath } from '../getFieldPath';
import { RowLabel } from '../../RowLabel';

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
      initCollapsed,
      description,
      components,
    },
  } = props;

  const CollapsibleLabelFromProps = components?.CollapsibleLabel || undefined;

  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>();
  const [fieldPreferencesKey] = useState(() => `collapsible-${toKebabCase(label)}`);

  const onToggle = useCallback(async (newCollapsedState: boolean) => {
    const existingPreferences: DocumentPreferences = await getPreference(preferencesKey);

    setPreference(preferencesKey, {
      ...existingPreferences,
      fields: {
        ...existingPreferences?.fields || {},
        [fieldPreferencesKey]: {
          ...existingPreferences?.fields?.[fieldPreferencesKey],
          collapsed: newCollapsedState,
        },
      },
    });
  }, [preferencesKey, fieldPreferencesKey, getPreference, setPreference]);

  useEffect(() => {
    const fetchInitialState = async () => {
      const preferences = await getPreference(preferencesKey);
      setCollapsedOnMount(Boolean(preferences?.fields?.[fieldPreferencesKey]?.collapsed ?? initCollapsed));
    };

    fetchInitialState();
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed]);

  if (typeof collapsedOnMount !== 'boolean') return null;

  return (
    <React.Fragment>
      <Collapsible
        initCollapsed={collapsedOnMount}
        className={[
          'field-type',
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
        header={(
          <RowLabel
            path={path}
            fallback={label}
            label={CollapsibleLabelFromProps}
          />
        )}
        onToggle={onToggle}
      >
        <RenderFields
          forceRender
          readOnly={readOnly}
          permissions={permissions}
          fieldTypes={fieldTypes}
          fieldSchema={fields.map((field) => ({
            ...field,
            path: getFieldPath(path, field),
          }))}
        />
      </Collapsible>
      <FieldDescription
        description={description}
      />
    </React.Fragment>
  );
};

export default withCondition(CollapsibleField);
